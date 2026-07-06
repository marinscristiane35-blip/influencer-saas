import "server-only";

import { listCampaignsForInfluencer } from "@/lib/campaigns/repository";
import { listInfluencerCoupons } from "@/lib/financial/repository";
import {
  getInfluencerMonthlyRankingPosition,
  listInfluencerCouponOrders,
  listInfluencerMonthlySummaries,
  sumCurrentMonthInfluencerCommissions,
  sumInfluencerTotalCommissions,
} from "@/lib/orders/repository";
import { getInfluencerWalletStatement } from "@/lib/wallet/service";

export async function getPortalDashboardViewModel(input: {
  companyId: string;
  influencerId: string;
}) {
  const [
    campaigns,
    coupons,
    currentMonthCommission,
    totalCommission,
    monthlyHistory,
    recentOrders,
    ranking,
    statement,
  ] = await Promise.all([
    listCampaignsForInfluencer(input),
    listInfluencerCoupons(input),
    sumCurrentMonthInfluencerCommissions(input),
    sumInfluencerTotalCommissions(input),
    listInfluencerMonthlySummaries({ ...input, months: 6 }),
    listInfluencerCouponOrders({ ...input, limit: 12 }),
    getInfluencerMonthlyRankingPosition(input),
    getInfluencerWalletStatement(input),
  ]);

  const currentMonth = monthlyHistory[0] ?? {
    commission_amount: "0",
    gross_amount: "0",
    month_start: new Date(),
    orders_count: BigInt(0),
  };
  const activeCoupons = coupons.filter((coupon) => coupon.status === "active");
  const primaryCoupon = activeCoupons[0]?.code ?? coupons[0]?.code ?? null;

  const insight =
    Number(currentMonthCommission) > 0
      ? "Seu cupom ja gerou comissao neste mes."
      : Number(currentMonth.gross_amount) > 0
        ? "Existem vendas com seu cupom aguardando consolidacao."
        : "Assim que entrarem pedidos pagos com seu cupom, eles aparecem aqui.";

  return {
    activeCoupons,
    campaigns,
    coupons,
    currentMonth,
    currentMonthCommission,
    insight,
    monthlyHistory,
    primaryCoupon,
    ranking,
    recentOrders,
    statement,
    totalCommission,
  };
}
