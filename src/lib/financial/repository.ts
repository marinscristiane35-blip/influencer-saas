import "server-only";

import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/database/prisma";

export type BalanceReleaseMode = "immediate" | "monthly";
export type InfluencerCouponStatus = "active" | "inactive";
export type CommissionEventStatus =
  | "pending"
  | "approved"
  | "blocked"
  | "available"
  | "cancelled"
  | "reversed";
export type CommissionSourceType = "order" | "spreadsheet" | "manual" | "challenge";

export type CompanyFinancialSettingsRow = {
  id: string;
  company_id: string;
  release_mode: BalanceReleaseMode;
  monthly_release_day: number | null;
  default_commission_rate: string | null;
  created_at: Date;
  updated_at: Date;
};

export type InfluencerCouponRow = {
  id: string;
  company_id: string;
  influencer_id: string;
  code: string;
  status: InfluencerCouponStatus;
  starts_at: Date | null;
  ends_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

export type CommissionEventRow = {
  id: string;
  company_id: string;
  influencer_id: string;
  coupon_id: string | null;
  source_type: CommissionSourceType;
  source_id: string | null;
  status: CommissionEventStatus;
  base_amount: string;
  commission_rate: string | null;
  amount: string;
  competence_month: number;
  competence_year: number;
  available_at: Date | null;
  description: string | null;
  metadata: unknown | null;
  created_at: Date;
  updated_at: Date;
};

export async function getOrCreateCompanyFinancialSettings(companyId: string) {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      INSERT INTO company_financial_settings (
        id,
        company_id,
        updated_at
      )
      VALUES (
        ${randomUUID()},
        ${companyId},
        now()
      )
      ON CONFLICT (company_id) DO NOTHING
    `;

    const rows = await tx.$queryRaw<CompanyFinancialSettingsRow[]>`
      SELECT
        id,
        company_id,
        release_mode,
        monthly_release_day,
        default_commission_rate::text,
        created_at,
        updated_at
      FROM company_financial_settings
      WHERE company_id = ${companyId}
      LIMIT 1
    `;

    return rows[0] ?? null;
  });
}

export async function listInfluencerCoupons(input: {
  companyId: string;
  influencerId?: string;
}) {
  return prisma.$queryRaw<InfluencerCouponRow[]>`
    SELECT
      id,
      company_id,
      influencer_id,
      code,
      status,
      starts_at,
      ends_at,
      created_at,
      updated_at
    FROM influencer_coupons
    WHERE company_id = ${input.companyId}
      AND (${input.influencerId ?? null}::text IS NULL OR influencer_id = ${input.influencerId ?? null})
    ORDER BY created_at DESC
  `;
}

export async function findActiveInfluencerCoupon(input: {
  companyId: string;
  code: string;
  at?: Date;
}) {
  const at = input.at ?? new Date();
  const rows = await prisma.$queryRaw<InfluencerCouponRow[]>`
    SELECT
      id,
      company_id,
      influencer_id,
      code,
      status,
      starts_at,
      ends_at,
      created_at,
      updated_at
    FROM influencer_coupons
    WHERE company_id = ${input.companyId}
      AND code = ${input.code}
      AND status = 'active'
      AND (starts_at IS NULL OR starts_at <= ${at})
      AND (ends_at IS NULL OR ends_at >= ${at})
    LIMIT 1
  `;

  return rows[0] ?? null;
}

export async function createInfluencerCoupon(input: {
  companyId: string;
  influencerId: string;
  code: string;
  startsAt?: Date | null;
  endsAt?: Date | null;
}) {
  const rows = await prisma.$queryRaw<InfluencerCouponRow[]>`
    INSERT INTO influencer_coupons (
      id,
      company_id,
      influencer_id,
      code,
      starts_at,
      ends_at,
      updated_at
    )
    SELECT
      ${randomUUID()},
      ${input.companyId},
      ${input.influencerId},
      ${input.code},
      ${input.startsAt ?? null},
      ${input.endsAt ?? null},
      now()
    FROM influencers
    WHERE id = ${input.influencerId}
      AND company_id = ${input.companyId}
    ON CONFLICT (company_id, code) DO NOTHING
    RETURNING
      id,
      company_id,
      influencer_id,
      code,
      status,
      starts_at,
      ends_at,
      created_at,
      updated_at
  `;

  return rows[0] ?? null;
}

export async function syncInfluencerPrimaryCoupon(input: {
  companyId: string;
  influencerId: string;
  code: string | null;
}) {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      UPDATE influencer_coupons
      SET status = 'inactive',
          updated_at = now()
      WHERE company_id = ${input.companyId}
        AND influencer_id = ${input.influencerId}
    `;

    if (!input.code) {
      return null;
    }

    const rows = await tx.$queryRaw<InfluencerCouponRow[]>`
      INSERT INTO influencer_coupons (
        id,
        company_id,
        influencer_id,
        code,
        status,
        updated_at
      )
      VALUES (
        ${randomUUID()},
        ${input.companyId},
        ${input.influencerId},
        ${input.code},
        'active',
        now()
      )
      ON CONFLICT (company_id, code)
      DO UPDATE SET
        influencer_id = EXCLUDED.influencer_id,
        status = 'active',
        updated_at = now()
      RETURNING
        id,
        company_id,
        influencer_id,
        code,
        status,
        starts_at,
        ends_at,
        created_at,
        updated_at
    `;

    return rows[0] ?? null;
  });
}

export async function findCommissionEventBySource(input: {
  companyId: string;
  sourceType: CommissionSourceType;
  sourceId: string;
}) {
  const rows = await prisma.$queryRaw<CommissionEventRow[]>`
    SELECT
      id,
      company_id,
      influencer_id,
      coupon_id,
      source_type,
      source_id,
      status,
      base_amount::text,
      commission_rate::text,
      amount::text,
      competence_month,
      competence_year,
      available_at,
      description,
      metadata,
      created_at,
      updated_at
    FROM commission_events
    WHERE company_id = ${input.companyId}
      AND source_type = ${input.sourceType}::"CommissionSourceType"
      AND source_id = ${input.sourceId}
    LIMIT 1
  `;

  return rows[0] ?? null;
}

export async function createCommissionEvent(input: {
  companyId: string;
  influencerId: string;
  couponId?: string | null;
  sourceType: CommissionSourceType;
  sourceId?: string | null;
  status: CommissionEventStatus;
  baseAmount: string;
  commissionRate?: string | null;
  amount: string;
  competenceMonth: number;
  competenceYear: number;
  availableAt?: Date | null;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  const metadata = input.metadata ? JSON.stringify(input.metadata) : null;
  const rows = await prisma.$transaction(async (tx) => {
    const influencers = await tx.$queryRaw<Array<{ id: string }>>`
      SELECT id
      FROM influencers
      WHERE id = ${input.influencerId}
        AND company_id = ${input.companyId}
      LIMIT 1
    `;

    if (!influencers[0]) {
      return [];
    }

    if (input.couponId) {
      const coupons = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT id
        FROM influencer_coupons
        WHERE id = ${input.couponId}
          AND company_id = ${input.companyId}
          AND influencer_id = ${input.influencerId}
        LIMIT 1
      `;

      if (!coupons[0]) {
        return [];
      }
    }

    return tx.$queryRaw<CommissionEventRow[]>`
      INSERT INTO commission_events (
        id,
        company_id,
        influencer_id,
        coupon_id,
        source_type,
        source_id,
        status,
        base_amount,
        commission_rate,
        amount,
        competence_month,
        competence_year,
        available_at,
        description,
        metadata,
        updated_at
      )
      VALUES (
        ${randomUUID()},
        ${input.companyId},
        ${input.influencerId},
        ${input.couponId ?? null},
        ${input.sourceType}::"CommissionSourceType",
        ${input.sourceId ?? null},
        ${input.status}::"CommissionEventStatus",
        ${input.baseAmount}::decimal,
        ${input.commissionRate ?? null}::decimal,
        ${input.amount}::decimal,
        ${input.competenceMonth},
        ${input.competenceYear},
        ${input.availableAt ?? null},
        ${input.description ?? null},
        ${metadata}::jsonb,
        now()
      )
      RETURNING
        id,
        company_id,
        influencer_id,
        coupon_id,
        source_type,
        source_id,
        status,
        base_amount::text,
        commission_rate::text,
        amount::text,
        competence_month,
        competence_year,
        available_at,
        description,
        metadata,
        created_at,
        updated_at
    `;
  });

  return rows[0] ?? null;
}
