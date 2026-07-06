import { PortalCampaignCards } from "@/components/portal/portal-campaign-cards";
import { PortalHero } from "@/components/portal/portal-hero";
import { PortalMetricCards } from "@/components/portal/portal-metric-cards";
import { PortalMonthlyHistory } from "@/components/portal/portal-monthly-history";
import { PortalOrdersTable } from "@/components/portal/portal-orders-table";
import { requireInfluencer } from "@/lib/auth/guards";
import { getPortalDashboardViewModel } from "@/lib/portal/dashboard-view-model";

export default async function PortalHomePage() {
  const context = await requireInfluencer();
  const viewModel = await getPortalDashboardViewModel({
    companyId: context.companyId,
    influencerId: context.influencerId,
  });
  const activeCampaigns = viewModel.campaigns.filter(
    (campaign) => campaign.status === "active",
  );

  return (
    <>
      <PortalHero
        commission={viewModel.currentMonthCommission}
        coupon={viewModel.primaryCoupon}
        insight={viewModel.insight}
        name={context.influencer.name}
        ordersCount={Number(viewModel.currentMonth.orders_count)}
        soldAmount={viewModel.currentMonth.gross_amount}
      />

      <PortalMetricCards
        availableBalance={viewModel.statement.wallet.available_balance}
        currentMonthSold={viewModel.currentMonth.gross_amount}
        primaryCoupon={viewModel.primaryCoupon}
        rankingPosition={
          viewModel.ranking ? Number(viewModel.ranking.position) : null
        }
        totalCommission={viewModel.totalCommission}
      />

      <PortalCampaignCards campaigns={activeCampaigns} />
      <PortalMonthlyHistory history={viewModel.monthlyHistory} />
      <PortalOrdersTable orders={viewModel.recentOrders} />
    </>
  );
}
