import "server-only";

import { canCompany } from "@/lib/auth/permissions";
import { listCampaignsForInfluencer } from "@/lib/campaigns/repository";
import { listInfluencerChallengeParticipation } from "@/lib/challenges/repository";
import { listInfluencerCoupons } from "@/lib/financial/repository";
import { findInfluencerPortalAccountByInfluencer } from "@/lib/influencers/portal-account-repository";
import { findInfluencerByCompany } from "@/lib/influencers/repository";
import { listInfluencerTimelineEvents } from "@/lib/influencers/timeline-repository";
import {
  getInfluencerMonthlyRankingPosition,
  listInfluencerMonthlySummaries,
  listRecentInfluencerCommissions,
  listRecentInfluencerCommissionOrders,
  sumCurrentMonthInfluencerCommissions,
} from "@/lib/orders/repository";
import { getInfluencerWalletStatement } from "@/lib/wallet/service";

export async function getInfluencerOperationalViewModel(input: {
  companyId: string;
  influencerId: string;
  permissions: Set<string>;
}) {
  const influencer = await findInfluencerByCompany({
    companyId: input.companyId,
    influencerId: input.influencerId,
  });

  if (!influencer) {
    return null;
  }

  const permissions = {
    canArchive: canCompany(input.permissions, "influencers:archive"),
    canChangeStatus: canCompany(input.permissions, "influencers:status"),
    canUpdate: canCompany(input.permissions, "influencers:update"),
    canViewCampaigns: canCompany(input.permissions, "campaigns:view"),
    canViewFinance: canCompany(input.permissions, "finance:view_sensitive"),
  };

  const [
    timelineEvents,
    linkedCampaigns,
    coupons,
    portalAccount,
    challengeParticipation,
    monthlyHistory,
    ranking,
    financial,
  ] = await Promise.all([
    listInfluencerTimelineEvents({
      companyId: input.companyId,
      influencerId: influencer.id,
      limit: 20,
    }),
    permissions.canViewCampaigns
      ? listCampaignsForInfluencer({
          companyId: input.companyId,
          influencerId: influencer.id,
        })
      : Promise.resolve([]),
    listInfluencerCoupons({
      companyId: input.companyId,
      influencerId: influencer.id,
    }),
    findInfluencerPortalAccountByInfluencer({
      companyId: input.companyId,
      influencerId: influencer.id,
    }),
    listInfluencerChallengeParticipation({
      companyId: input.companyId,
      influencerId: influencer.id,
    }),
    listInfluencerMonthlySummaries({
      companyId: input.companyId,
      influencerId: influencer.id,
      months: 6,
    }),
    getInfluencerMonthlyRankingPosition({
      companyId: input.companyId,
      influencerId: influencer.id,
    }),
    permissions.canViewFinance
      ? Promise.all([
          getInfluencerWalletStatement({
            companyId: input.companyId,
            influencerId: influencer.id,
          }),
          sumCurrentMonthInfluencerCommissions({
            companyId: input.companyId,
            influencerId: influencer.id,
          }),
          listRecentInfluencerCommissionOrders({
            companyId: input.companyId,
            influencerId: influencer.id,
            limit: 8,
          }),
          listRecentInfluencerCommissions({
            companyId: input.companyId,
            influencerId: influencer.id,
            limit: 8,
          }),
        ])
      : Promise.resolve(null),
  ]);

  const [statement, currentMonthCommission, recentOrders, recentCommissions] =
    financial ?? [null, "0", [], []];
  const currentMonth = monthlyHistory[0] ?? {
    commission_amount: "0",
    gross_amount: "0",
    month_start: new Date(),
    orders_count: BigInt(0),
  };
  const attributedOrdersCount = recentOrders.length;
  const averageTicket =
    recentOrders.length > 0
      ? (
          recentOrders.reduce(
            (total, order) => total + Number(order.gross_amount),
            0,
          ) / recentOrders.length
        ).toFixed(2)
      : "0";

  return {
    attributedOrdersCount,
    averageTicket,
    coupons,
    currentMonth,
    currentMonthCommission,
    challengeParticipation,
    influencer,
    linkedCampaigns,
    permissions,
    portalAccount,
    ranking,
    recentCommissions,
    recentOrders,
    statement,
    timelineEvents,
  };
}
