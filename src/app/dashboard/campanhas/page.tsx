import { requireCompanyPermission } from "@/lib/tenant/context";
import { listCampaignsByCompany } from "@/lib/campaigns/repository";
import { CampaignForm } from "@/components/campaign-form";

const statusLabels = {
  draft: "Rascunho",
  active: "Ativa",
  paused: "Pausada",
  finished: "Finalizada",
} as const;

const statusClasses = {
  draft: "status-badge status-draft",
  active: "status-badge status-active",
  paused: "status-badge status-paused",
  finished: "status-badge status-finished",
} as const;

function formatDate(value: Date | null) {
  return value
    ? new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(value)
    : "-";
}

function formatBudget(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency",
  }).format(Number(value));
}

export default async function CampaignsPage() {
  const tenant = await requireCompanyPermission("campaigns:view");

  const campaigns = await listCampaignsByCompany(tenant.companyId);

  return (
    <>
      <section className="page-heading compact-heading">
        <p className="eyebrow">Campanhas</p>
        <h2>Planejamento comercial da empresa</h2>
        <p className="muted">
          Crie campanhas para organizar objetivo, periodo, status e orcamento
          previsto dentro do tenant atual.
        </p>
      </section>

      <div className="influencers-layout">
        <section className="form-panel elevated-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">{tenant.company.name}</p>
              <h2>Nova campanha</h2>
            </div>
            <span className="panel-chip">Tenant</span>
          </div>
          <CampaignForm />
        </section>

        <section className="form-panel elevated-panel list-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Base da empresa</p>
              <h2>Campanhas</h2>
            </div>
            <span className="panel-chip">{campaigns.length} cadastradas</span>
          </div>
          {campaigns.length === 0 ? (
            <div className="empty-state">
              <strong>Nenhuma campanha cadastrada ainda</strong>
              <p>
                Crie a primeira campanha para estruturar objetivo, periodo e
                orcamento antes de relacionar influenciadores no futuro.
              </p>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="data-table campaigns-table">
                <thead>
                  <tr>
                    <th>Campanha</th>
                    <th>Objetivo</th>
                    <th>Periodo</th>
                    <th>Orcamento</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((campaign) => (
                    <tr key={campaign.id}>
                      <td>
                        <strong>{campaign.name}</strong>
                        {campaign.description ? (
                          <span className="table-note">{campaign.description}</span>
                        ) : null}
                        {campaign.notes ? (
                          <span className="table-note">{campaign.notes}</span>
                        ) : null}
                      </td>
                      <td>{campaign.objective ?? "-"}</td>
                      <td>
                        <span>{formatDate(campaign.starts_at)}</span>
                        <span className="table-note">{formatDate(campaign.ends_at)}</span>
                      </td>
                      <td>{formatBudget(campaign.planned_budget)}</td>
                      <td>
                        <span className={statusClasses[campaign.status]}>
                          {statusLabels[campaign.status]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
