import { requireInfluencer } from "@/lib/auth/guards";
import { listCampaignsForInfluencer } from "@/lib/campaigns/repository";
import { listInfluencerCoupons } from "@/lib/financial/repository";

const campaignStatusLabels = {
  active: "Ativa",
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

function campaignStatusClass(status: keyof typeof campaignStatusLabels) {
  return status === "active"
    ? "status-badge status-active"
    : status === "paused"
      ? "status-badge status-paused"
      : status === "finished"
        ? "status-badge status-finished"
        : "status-badge status-invited";
}

export default async function PortalCampaignsPage() {
  const context = await requireInfluencer();
  const [campaigns, coupons] = await Promise.all([
    listCampaignsForInfluencer({
      companyId: context.companyId,
      influencerId: context.influencerId,
    }),
    listInfluencerCoupons({
      companyId: context.companyId,
      influencerId: context.influencerId,
    }),
  ]);
  const activeCoupons = coupons.filter((coupon) => coupon.status === "active");

  return (
    <>
      <section className="page-heading compact-heading">
        <p className="eyebrow">Campanhas</p>
        <h2>Suas campanhas e cupons</h2>
        <p className="muted">
          Veja o que esta liberado para divulgar e quais cupons estao
          associados ao seu perfil nesta empresa.
        </p>
      </section>

      <section className="metric-grid section-gap">
        <article className="metric-card">
          <p>Campanhas vinculadas</p>
          <div className="metric">{campaigns.length}</div>
          <span>Somente campanhas liberadas para seu perfil.</span>
        </article>
        <article className="metric-card">
          <p>Cupons ativos</p>
          <div className="metric">{activeCoupons.length}</div>
          <span>Codigos disponiveis para pedidos importados.</span>
        </article>
        <article className="metric-card">
          <p>Total de cupons</p>
          <div className="metric">{coupons.length}</div>
          <span>Historico vinculado ao seu perfil.</span>
        </article>
      </section>

      <section className="form-panel elevated-panel section-gap">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">{context.companyName}</p>
            <h2>Campanhas vinculadas</h2>
          </div>
          <span className="panel-chip">{campaigns.length} campanhas</span>
        </div>
        {campaigns.length === 0 ? (
          <div className="empty-state">
            <strong>Nenhuma campanha vinculada ainda</strong>
            <p>
              Quando a empresa vincular uma campanha ao seu perfil, ela
              aparecera aqui.
            </p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Campanha</th>
                  <th>Objetivo</th>
                  <th>Status</th>
                  <th>Seu vinculo</th>
                  <th>Periodo</th>
                  <th>Cupons</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((campaign) => (
                  <tr key={campaign.link_id}>
                    <td>
                      <strong>{campaign.name}</strong>
                      {campaign.description ? (
                        <span className="table-note">{campaign.description}</span>
                      ) : null}
                    </td>
                    <td>{campaign.objective ?? "-"}</td>
                    <td>
                      <span className={campaignStatusClass(campaign.status)}>
                        {campaignStatusLabels[campaign.status]}
                      </span>
                    </td>
                    <td>{linkStatusLabels[campaign.link_status]}</td>
                    <td>
                      {campaign.starts_at
                        ? new Intl.DateTimeFormat("pt-BR").format(
                            campaign.starts_at,
                          )
                        : "-"}
                      <span className="table-note">
                        {campaign.ends_at
                          ? new Intl.DateTimeFormat("pt-BR").format(
                              campaign.ends_at,
                            )
                          : "-"}
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

      <section className="form-panel elevated-panel section-gap">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">{context.companyName}</p>
            <h2>Cupons vinculados</h2>
          </div>
          <span className="panel-chip">{coupons.length} cupons</span>
        </div>
        {coupons.length === 0 ? (
          <div className="empty-state">
            <strong>Nenhum cupom vinculado ainda</strong>
            <p>
              Quando a empresa cadastrar um cupom para seu perfil, ele aparecera
              aqui.
            </p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Cupom</th>
                  <th>Status</th>
                  <th>Inicio</th>
                  <th>Fim</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((coupon) => (
                  <tr key={coupon.id}>
                    <td>
                      <strong>{coupon.code}</strong>
                    </td>
                    <td>
                      <span
                        className={
                          coupon.status === "active"
                            ? "status-badge status-active"
                            : "status-badge status-paused"
                        }
                      >
                        {coupon.status === "active" ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td>
                      {coupon.starts_at
                        ? new Intl.DateTimeFormat("pt-BR").format(
                            coupon.starts_at,
                          )
                        : "-"}
                    </td>
                    <td>
                      {coupon.ends_at
                        ? new Intl.DateTimeFormat("pt-BR").format(coupon.ends_at)
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
