import { requireCompanyPermission } from "@/lib/tenant/context";
import {
  listCampaignInfluencersByCompany,
  listCampaignsByCompany,
} from "@/lib/campaigns/repository";
import { unlinkCampaignInfluencerAction } from "@/app/actions/campaigns";
import { CampaignForm } from "@/components/campaign-form";
import { CampaignInfluencerLinkForm } from "@/components/campaign-influencer-link-form";
import { listInfluencersByCompany } from "@/lib/influencers/repository";

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
  const canManageCampaigns = tenant.can("campaigns:manage");

  const [campaigns, influencers, campaignInfluencers] = await Promise.all([
    listCampaignsByCompany(tenant.companyId),
    listInfluencersByCompany(tenant.companyId),
    listCampaignInfluencersByCompany(tenant.companyId),
  ]);
  const campaignInfluencersByCampaign = new Map(
    campaigns.map((campaign) => [
      campaign.id,
      campaignInfluencers.filter((link) => link.campaign_id === campaign.id),
    ]),
  );

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

        {canManageCampaigns ? (
          <section className="form-panel elevated-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Participantes</p>
                <h2>Vincular influenciador</h2>
              </div>
              <span className="panel-chip">Tenant</span>
            </div>
            {campaigns.length === 0 || influencers.length === 0 ? (
              <div className="empty-state">
                <strong>Cadastros insuficientes</strong>
                <p>
                  Crie ao menos uma campanha e um influenciador para fazer o
                  vinculo.
                </p>
              </div>
            ) : (
              <CampaignInfluencerLinkForm
                campaigns={campaigns.map((campaign) => ({
                  id: campaign.id,
                  name: campaign.name,
                }))}
                influencers={influencers
                  .filter((influencer) => !influencer.archived_at)
                  .map((influencer) => ({
                    id: influencer.id,
                    name: influencer.name,
                  }))}
              />
            )}
          </section>
        ) : null}

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
                {campaigns.map((campaign) => {
                  const links = campaignInfluencersByCampaign.get(campaign.id) ?? [];

                  return (
                    <tr key={campaign.id}>
                      <td>
                        <strong>{campaign.name}</strong>
                        {campaign.description ? (
                          <span className="table-note">{campaign.description}</span>
                        ) : null}
                        {campaign.notes ? (
                          <span className="table-note">{campaign.notes}</span>
                        ) : null}
                        {links.length > 0 ? (
                          <span className="table-note">
                            {links.length} influenciador(es) vinculado(s)
                          </span>
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
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
      </div>

      <section className="form-panel elevated-panel list-panel section-gap">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Participantes</p>
            <h2>Influenciadores por campanha</h2>
          </div>
          <span className="panel-chip">
            {campaignInfluencers.length} vinculos
          </span>
        </div>
        {campaignInfluencers.length === 0 ? (
          <div className="empty-state">
            <strong>Nenhum influenciador vinculado ainda</strong>
            <p>
              Use o formulario de participantes para liberar campanhas no
              portal do influenciador.
            </p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Campanha</th>
                  <th>Influenciador</th>
                  <th>Status</th>
                  <th>Cupom</th>
                  {canManageCampaigns ? <th>Acao</th> : null}
                </tr>
              </thead>
              <tbody>
                {campaignInfluencers.map((link) => {
                  const campaign = campaigns.find(
                    (item) => item.id === link.campaign_id,
                  );

                  return (
                    <tr key={link.id}>
                      <td>{campaign?.name ?? "Campanha removida"}</td>
                      <td>
                        <strong>{link.influencer_name}</strong>
                        <span className="table-note">{link.influencer_email}</span>
                      </td>
                      <td>
                        <span className="status-badge status-active">
                          {link.status}
                        </span>
                      </td>
                      <td>{link.influencer_coupon_code ?? "-"}</td>
                      {canManageCampaigns ? (
                        <td>
                          <form action={unlinkCampaignInfluencerAction}>
                            <input
                              name="campaignId"
                              type="hidden"
                              value={link.campaign_id}
                            />
                            <input
                              name="influencerId"
                              type="hidden"
                              value={link.influencer_id}
                            />
                            <button className="button secondary-button" type="submit">
                              Desvincular
                            </button>
                          </form>
                        </td>
                      ) : null}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
