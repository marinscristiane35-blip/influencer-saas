import { InfluencerCommissionsTable } from "@/components/influencers/influencer-commissions-table";
import { InfluencerChallengesPanel } from "@/components/influencers/influencer-challenges-panel";
import { InfluencerCouponsPanel } from "@/components/influencers/influencer-coupons-panel";
import { InfluencerFinancialCards } from "@/components/influencers/influencer-financial-cards";
import { InfluencerFutureBlocks } from "@/components/influencers/influencer-future-blocks";
import { InfluencerLinkedCampaigns } from "@/components/influencers/influencer-linked-campaigns";
import { InfluencerNotFound } from "@/components/influencers/influencer-not-found";
import { InfluencerOperationalHero } from "@/components/influencers/influencer-operational-hero";
import { InfluencerOrdersTable } from "@/components/influencers/influencer-orders-table";
import { InfluencerSidePanel } from "@/components/influencers/influencer-side-panel";
import { InfluencerTimeline } from "@/components/influencers/influencer-timeline";
import { InfluencerTransactionsTable } from "@/components/influencers/influencer-transactions-table";
import { getInfluencerOperationalViewModel } from "@/lib/influencers/operational-view-model";
import { requireCompanyPermission } from "@/lib/tenant/context";

export default async function InfluencerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [{ id }, tenant] = await Promise.all([
    params,
    requireCompanyPermission("influencers:view"),
  ]);
  const viewModel = await getInfluencerOperationalViewModel({
    companyId: tenant.companyId,
    influencerId: id,
    permissions: tenant.permissions,
  });

  if (!viewModel) {
    return <InfluencerNotFound />;
  }

  const {
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
  } = viewModel;

  return (
    <>
      <InfluencerOperationalHero
        canArchive={permissions.canArchive}
        canChangeStatus={permissions.canChangeStatus}
        canUpdate={permissions.canUpdate}
        currentMonthCommission={currentMonthCommission}
        currentMonthOrders={Number(currentMonth.orders_count)}
        currentMonthSold={currentMonth.gross_amount}
        influencer={influencer}
        portalStatus={portalAccount?.status ?? null}
        rankingPosition={ranking ? Number(ranking.position) : null}
        saldoDisponivel={statement?.wallet.available_balance ?? null}
      />

      <InfluencerFinancialCards
        attributedOrdersCount={attributedOrdersCount}
        averageTicket={averageTicket}
        canViewFinance={permissions.canViewFinance}
        currentMonthCommission={currentMonthCommission}
        wallet={statement?.wallet ?? null}
      />

      <div className="profile-grid section-gap">
        <div>
          <InfluencerCouponsPanel coupons={coupons} />
          <InfluencerChallengesPanel challenges={challengeParticipation} />
          <InfluencerLinkedCampaigns
            campaigns={linkedCampaigns}
            canViewCampaigns={permissions.canViewCampaigns}
          />
          {permissions.canViewFinance ? (
            <>
              <InfluencerOrdersTable
                influencerId={influencer.id}
                orders={recentOrders}
              />
              <InfluencerCommissionsTable commissions={recentCommissions} />
              <InfluencerTransactionsTable
                transactions={statement?.transactions ?? []}
              />
            </>
          ) : null}
          <InfluencerTimeline events={timelineEvents} />
        </div>
        <InfluencerSidePanel
          canUpdate={permissions.canUpdate}
          influencer={influencer}
        />
      </div>

      <InfluencerFutureBlocks />
    </>
  );
}
