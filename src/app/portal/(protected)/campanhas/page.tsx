import { requireInfluencer } from "@/lib/auth/guards";
import { listInfluencerCoupons } from "@/lib/financial/repository";

export default async function PortalCampaignsPage() {
  const context = await requireInfluencer();
  const coupons = await listInfluencerCoupons({
    companyId: context.companyId,
    influencerId: context.influencerId,
  });
  const activeCoupons = coupons.filter((coupon) => coupon.status === "active");

  return (
    <>
      <section className="page-heading compact-heading">
        <p className="eyebrow">Campanhas</p>
        <h2>Suas campanhas e cupons</h2>
        <p className="muted">
          As campanhas vinculadas aparecerao aqui quando a relacao
          campanha-influenciador for criada. Por enquanto, acompanhe os cupons
          ativos do seu perfil.
        </p>
      </section>

      <section className="metric-grid section-gap">
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
