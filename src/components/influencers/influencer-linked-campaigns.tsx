import { shortDate } from "@/components/influencers/format";
import type { InfluencerCampaignRow } from "@/lib/campaigns/repository";

const statusLabels = {
  active: "Ativo",
  draft: "Rascunho",
  finished: "Finalizada",
  paused: "Pausada",
} as const;

const linkStatusLabels = {
  active: "Participando",
  finished: "Finalizado",
  invited: "Convidado",
  paused: "Pausado",
} as const;

function statusClass(status: InfluencerCampaignRow["status"]) {
  return status === "active"
    ? "status-badge status-active"
    : status === "paused"
      ? "status-badge status-paused"
      : status === "finished"
        ? "status-badge status-finished"
        : "status-badge status-invited";
}

export function InfluencerLinkedCampaigns({
  campaigns,
  canViewCampaigns,
}: {
  campaigns: InfluencerCampaignRow[];
  canViewCampaigns: boolean;
}) {
  if (!canViewCampaigns) {
    return null;
  }

  return (
    <section className="form-panel elevated-panel section-gap">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Operacao</p>
          <h2>Campanhas vinculadas</h2>
        </div>
        <span className="panel-chip">{campaigns.length} campanhas</span>
      </div>
      {campaigns.length === 0 ? (
        <div className="empty-state">
          <strong>Nenhuma campanha vinculada</strong>
          <p>
            Quando este influenciador for associado a uma campanha, o historico
            operacional aparecera aqui.
          </p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Campanha</th>
                <th>Status</th>
                <th>Vinculo</th>
                <th>Periodo</th>
                <th>Cupons</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((campaign) => (
                <tr key={campaign.link_id}>
                  <td>
                    <strong>{campaign.name}</strong>
                    {campaign.objective ? (
                      <span className="table-note">{campaign.objective}</span>
                    ) : null}
                  </td>
                  <td>
                    <span className={statusClass(campaign.status)}>
                      {statusLabels[campaign.status]}
                    </span>
                  </td>
                  <td>{linkStatusLabels[campaign.link_status]}</td>
                  <td>
                    {shortDate(campaign.starts_at)}
                    <span className="table-note">
                      ate {shortDate(campaign.ends_at)}
                    </span>
                  </td>
                  <td>{campaign.coupon_codes ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
