import Link from "next/link";
import { shortDate } from "@/components/influencers/format";
import type { InfluencerCampaignRow } from "@/lib/campaigns/repository";

const statusLabels = {
  active: "Ativa",
  draft: "Rascunho",
  finished: "Finalizada",
  paused: "Pausada",
} as const;

export function PortalCampaignCards({
  campaigns,
}: {
  campaigns: InfluencerCampaignRow[];
}) {
  return (
    <section className="form-panel elevated-panel section-gap">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Campanhas ativas</p>
          <h2>O que divulgar agora</h2>
        </div>
        <Link className="filter-chip active" href="/portal/campanhas">
          Ver todas
        </Link>
      </div>
      {campaigns.length === 0 ? (
        <div className="empty-state">
          <strong>Nenhuma campanha vinculada ainda</strong>
          <p>
            Quando a empresa liberar uma campanha para seu perfil, ela aparece
            aqui com os cupons de divulgacao.
          </p>
        </div>
      ) : (
        <div className="portal-campaign-grid">
          {campaigns.slice(0, 3).map((campaign) => (
            <article className="portal-campaign-card" key={campaign.link_id}>
              <span className="status-badge status-active">
                {statusLabels[campaign.status]}
              </span>
              <strong>{campaign.name}</strong>
              <p>{campaign.objective ?? campaign.description ?? "Campanha vinculada ao seu perfil."}</p>
              <div>
                <span>Periodo</span>
                <strong>
                  {shortDate(campaign.starts_at)} ate {shortDate(campaign.ends_at)}
                </strong>
              </div>
              <div>
                <span>Cupons</span>
                <strong>{campaign.coupon_codes ?? "-"}</strong>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
