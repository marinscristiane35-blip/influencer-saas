import Link from "next/link";
import { ActionCard, MetricCard, PageHero } from "@/components/operational-ui";
import { prisma } from "@/lib/database/prisma";
import {
  countActiveCampaignsByCompany,
  countCampaignsByCompany,
  listCampaignsByCompany,
} from "@/lib/campaigns/repository";
import {
  countInfluencersByCompany,
  listInfluencerOperationalSummaries,
} from "@/lib/influencers/repository";
import { getTenant } from "@/lib/tenant/context";

function money(value: string | number | null | undefined) {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency",
  }).format(Number(value ?? 0));
}

export default async function DashboardPage() {
  const tenant = await getTenant();

  if (!tenant) {
    return null;
  }

  const [
    pendingInvites,
    totalInfluencers,
    totalCampaigns,
    activeCampaigns,
    influencers,
    campaigns,
  ] = await Promise.all([
      prisma.companyMember.count({
        where: {
          companyId: tenant.companyId,
          status: "invited",
        },
      }),
      countInfluencersByCompany(tenant.companyId),
      countCampaignsByCompany(tenant.companyId),
      countActiveCampaignsByCompany(tenant.companyId),
      listInfluencerOperationalSummaries({
        companyId: tenant.companyId,
      }),
      listCampaignsByCompany(tenant.companyId),
    ]);
  const currentMonthOrders = influencers.reduce(
    (total, influencer) =>
      total + Number(influencer.current_month_orders_count ?? 0),
    0,
  );
  const currentMonthSold = influencers.reduce(
    (total, influencer) =>
      total + Number(influencer.current_month_sold_amount ?? 0),
    0,
  );
  const currentMonthCommission = influencers.reduce(
    (total, influencer) =>
      total + Number(influencer.current_month_commission ?? 0),
    0,
  );
  const topInfluencers = [...influencers]
    .sort(
      (left, right) =>
        Number(right.current_month_sold_amount ?? 0) -
        Number(left.current_month_sold_amount ?? 0),
    )
    .slice(0, 3);
  const activeCampaignList = campaigns
    .filter((campaign) => campaign.status === "active")
    .slice(0, 3);

  const metrics = [
    {
      detail: "Base cadastrada na empresa",
      label: "Influenciadores",
      value: totalInfluencers.toString(),
    },
    {
      detail: "Campanhas em execucao neste tenant",
      label: "Campanhas ativas",
      value: activeCampaigns.toString(),
    },
    {
      detail: "Pedidos pagos importados neste mes",
      label: "Pedidos do mes",
      value: currentMonthOrders.toString(),
    },
    {
      detail: "Valor comissionavel do mes",
      label: "Vendido no mes",
      value: money(currentMonthSold),
    },
    {
      detail: "Comissoes geradas por cupom",
      label: "Comissao do mes",
      value: money(currentMonthCommission),
    },
    {
      detail: "Acessos ou usuarios convidados",
      label: "Convites pendentes",
      value: pendingInvites.toString(),
    },
  ];

  return (
    <>
      <PageHero
        actions={
          <>
            <Link className="button primary-action" href="/dashboard/influenciadores">
              Cadastrar influenciador
            </Link>
            <Link className="button secondary-button" href="/dashboard/campanhas">
              Criar campanha
            </Link>
          </>
        }
        eyebrow="Painel da empresa"
        metric={{
          detail:
            currentMonthOrders > 0
              ? "Pedidos com cupom importados neste mes."
              : "Importe pedidos para acompanhar vendas por cupom.",
          label: "Operacao do mes",
          value: money(currentMonthSold),
        }}
        subtitle="Acompanhe influenciadores, campanhas, cupons e resultados com uma leitura rapida da operacao atual."
        title={tenant.company.name}
      />

      <section className="metric-grid section-gap">
        {metrics.map((metric, index) => (
          <MetricCard
            detail={metric.detail}
            key={metric.label}
            label={metric.label}
            tone={index === 3 ? "accent" : "default"}
            value={metric.value}
          />
        ))}
      </section>

      <section className="next-steps product-section section-gap">
        <div>
          <p className="eyebrow">Proximos passos</p>
          <h2>Avance a operacao sem perder o fio</h2>
          <p className="muted">
            O painel fica mais rico conforme a empresa cadastra cupons, vincula
            campanhas e importa pedidos com cupom.
          </p>
        </div>
        <div className="action-grid">
          <ActionCard
            detail={
              totalInfluencers === 0
                ? "Crie a primeira base da empresa."
                : `${totalInfluencers} perfis cadastrados.`
            }
            href="/dashboard/influenciadores"
            label="Influenciadores"
          />
          <ActionCard
            detail={
              totalCampaigns === 0
                ? "Organize a primeira ativacao."
                : `${activeCampaigns} campanhas ativas.`
            }
            href="/dashboard/campanhas"
            label="Campanhas"
          />
          <ActionCard
            detail={
              currentMonthOrders === 0
                ? "Importe pedidos para liberar metricas."
                : `${currentMonthOrders} pedidos no mes.`
            }
            href="/dashboard/financeiro"
            label="Pedidos e comissoes"
          />
        </div>
      </section>

      <div className="dashboard-summary-grid section-gap">
        <section className="form-panel elevated-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Ranking rapido</p>
              <h2>Top influenciadores do mes</h2>
            </div>
            <Link className="filter-chip active" href="/dashboard/influenciadores">
              Ver todos
            </Link>
          </div>
          {topInfluencers.length === 0 ? (
            <div className="empty-state">
              <strong>Nenhum influenciador ainda</strong>
              <p>Cadastre influenciadores com cupom para formar o ranking.</p>
            </div>
          ) : (
            <div className="dashboard-mini-list">
              {topInfluencers.map((influencer, index) => (
                <Link
                  className="dashboard-mini-row"
                  href={`/dashboard/influenciadores/${influencer.id}`}
                  key={influencer.id}
                >
                  <span className="ranking-position">#{index + 1}</span>
                  <div>
                    <strong>{influencer.name}</strong>
                    <span>{influencer.coupon_code ?? "Sem cupom"}</span>
                  </div>
                  <strong>{money(influencer.current_month_sold_amount)}</strong>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="form-panel elevated-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Campanhas</p>
              <h2>Ativas agora</h2>
            </div>
            <Link className="filter-chip active" href="/dashboard/campanhas">
              Ver campanhas
            </Link>
          </div>
          {activeCampaignList.length === 0 ? (
            <div className="empty-state">
              <strong>Nenhuma campanha ativa</strong>
              <p>Crie ou ative uma campanha para orientar a divulgacao.</p>
            </div>
          ) : (
            <div className="dashboard-mini-list">
              {activeCampaignList.map((campaign) => (
                <article className="dashboard-mini-row" key={campaign.id}>
                  <span className="status-badge status-active">Ativa</span>
                  <div>
                    <strong>{campaign.name}</strong>
                    <span>{campaign.objective ?? "Sem objetivo informado"}</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
