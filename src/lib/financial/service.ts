import "server-only";

import {
  createCommissionEvent,
  findActiveInfluencerCoupon,
  findCommissionEventBySource,
  getOrCreateCompanyFinancialSettings,
  type CommissionSourceType,
} from "@/lib/financial/repository";

function assertPositiveMoney(value: string, label: string) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${label} precisa ser um valor positivo.`);
  }

  return parsed.toFixed(2);
}

function normalizeCouponCode(code: string) {
  return code.trim().toUpperCase();
}

function getCompetence(date: Date) {
  return {
    month: date.getMonth() + 1,
    year: date.getFullYear(),
  };
}

function getMonthlyAvailabilityDate(input: {
  orderedAt: Date;
  releaseDay: number;
}) {
  const releaseMonth = input.orderedAt.getMonth() + 1;
  const releaseYear = input.orderedAt.getFullYear();

  return new Date(releaseYear, releaseMonth, input.releaseDay, 0, 0, 0, 0);
}

export async function getCompanyFinancialSettings(companyId: string) {
  return getOrCreateCompanyFinancialSettings(companyId);
}

export async function matchInfluencerCoupon(input: {
  companyId: string;
  couponCode: string;
  at?: Date;
}) {
  return findActiveInfluencerCoupon({
    at: input.at,
    code: normalizeCouponCode(input.couponCode),
    companyId: input.companyId,
  });
}

export async function prepareCommissionEvent(input: {
  companyId: string;
  couponCode: string;
  sourceType: CommissionSourceType;
  sourceId: string;
  baseAmount: string;
  commissionRate?: string | null;
  orderedAt: Date;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  const existing = await findCommissionEventBySource({
    companyId: input.companyId,
    sourceId: input.sourceId,
    sourceType: input.sourceType,
  });

  if (existing) {
    return existing;
  }

  const coupon = await matchInfluencerCoupon({
    at: input.orderedAt,
    companyId: input.companyId,
    couponCode: input.couponCode,
  });

  if (!coupon) {
    return null;
  }

  const settings = await getOrCreateCompanyFinancialSettings(input.companyId);
  const baseAmount = assertPositiveMoney(input.baseAmount, "Base da comissao");
  const rate = input.commissionRate ?? settings?.default_commission_rate ?? null;

  if (!rate) {
    throw new Error("Configure uma taxa de comissao para gerar o evento.");
  }

  const commissionRate = assertPositiveMoney(rate, "Taxa de comissao");
  const amount = ((Number(baseAmount) * Number(commissionRate)) / 100).toFixed(2);
  const competence = getCompetence(input.orderedAt);
  const releaseMode = settings?.release_mode ?? "immediate";
  const releaseDay = settings?.monthly_release_day ?? 5;
  const availableAt =
    releaseMode === "monthly"
      ? getMonthlyAvailabilityDate({
          orderedAt: input.orderedAt,
          releaseDay,
        })
      : input.orderedAt;

  return createCommissionEvent({
    amount,
    availableAt,
    baseAmount,
    commissionRate,
    companyId: input.companyId,
    competenceMonth: competence.month,
    competenceYear: competence.year,
    couponId: coupon.id,
    description: input.description ?? null,
    influencerId: coupon.influencer_id,
    metadata: input.metadata ?? null,
    sourceId: input.sourceId,
    sourceType: input.sourceType,
    status: releaseMode === "monthly" ? "blocked" : "approved",
  });
}
