import { prisma } from "@/lib/database/prisma";
import {
  countActiveCampaignsByCompany,
  countCampaignsByCompany,
} from "@/lib/campaigns/repository";
import { countInfluencersByCompany } from "@/lib/influencers/repository";
import { getTenant } from "@/lib/tenant/context";

export default async function DashboardPage() {
  const tenant = await getTenant();

  if (!tenant) {
    return null;
  }

  const [pendingInvites, totalInfluencers, totalCampaigns, activeCampaigns] =
    await Promise.all([
      prisma.companyMember.count({
        where: {
          companyId: tenant.companyId,
          status: "invited",
        },
      }),
      countInfluencersByCompany(tenant.companyId),
      countCampaignsByCompany(tenant.companyId),
      countActiveCampaignsByCompany(tenant.companyId),
    ]);

  const metrics = [
    {
      detail: "Base cadastrada no tenant atual",
      label: "Influenciadores",
      value: totalInfluencers.toString(),
    },
    {
      detail: "Campanhas em execucao neste tenant",
      label: "Campanhas ativas",
      value: activeCampaigns.toString(),
    },
    {
      detail: "Inclui rascunhos, pausadas e finalizadas",
      label: "Total de campanhas",
      value: totalCampaigns.toString(),
    },
    {
      detail: "Usuarios convidados para esta empresa",
      label: "Convites pendentes",
      value: pendingInvites.toString(),
    },
    { detail: "Operacao isolada por empresa", label: "Status do tenant", value: "Ativo" },
  ];

  return (
    <>
      <section className="page-heading">
        <p className="eyebrow">Visao geral</p>
        <h2>Resumo da operacao</h2>
        <p className="muted">
          Acompanhe os primeiros indicadores da empresa e avance a configuracao
          da operacao de influenciadores.
        </p>
      </section>

      <section className="metric-grid">
        {metrics.map((metric) => (
          <article className="metric-card" key={metric.label}>
            <p>{metric.label}</p>
            <div className="metric">{metric.value}</div>
            <span>{metric.detail}</span>
          </article>
        ))}
      </section>

      <section className="next-steps section-gap">
        <div>
          <p className="eyebrow">Proximos passos</p>
          <h2>Prepare a primeira campanha</h2>
          <p className="muted">
            Comece cadastrando influenciadores com cupom e status. Depois, a
            area de campanhas podera usar essa base para organizar a operacao.
          </p>
        </div>
        <div className="step-list">
          <span>Cadastrar influenciadores</span>
          <span>Conferir cupons unicos</span>
          <span>Ativar campanhas quando o modulo estiver pronto</span>
        </div>
      </section>
    </>
  );
}
