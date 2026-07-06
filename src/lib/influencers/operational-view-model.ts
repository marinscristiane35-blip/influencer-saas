import "server-only";

import { canCompany } from "@/lib/auth/permissions";
import { findInfluencerByCompany } from "@/lib/influencers/repository";
import { listInfluencerTimelineEvents } from "@/lib/influencers/timeline-repository";
import {
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
    canViewFinance: canCompany(input.permissions, "finance:view_sensitive"),
  };

  const [timelineEvents, financial] = await Promise.all([
    listInfluencerTimelineEvents({
      companyId: input.companyId,
      influencerId: influencer.id,
      limit: 20,
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
    currentMonthCommission,
    influencer,
    permissions,
    recentCommissions,
    recentOrders,
    statement,
    timelineEvents,
  };
}
