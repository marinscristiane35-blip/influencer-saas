import { shortDate } from "@/components/influencers/format";
import type { InfluencerCouponRow } from "@/lib/financial/repository";

export function InfluencerCouponsPanel({
  coupons,
}: {
  coupons: InfluencerCouponRow[];
}) {
  return (
    <section className="form-panel elevated-panel section-gap">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Cupons</p>
          <h2>Codigos vinculados</h2>
        </div>
        <span className="panel-chip">{coupons.length}</span>
      </div>
      {coupons.length === 0 ? (
        <div className="empty-state">
          <strong>Nenhum cupom vinculado</strong>
          <p>
            Cadastre um cupom no perfil para atribuir pedidos e comissoes a este
            influenciador.
          </p>
        </div>
      ) : (
        <div className="portal-campaign-grid">
          {coupons.map((coupon) => (
            <article className="portal-campaign-card" key={coupon.id}>
              <span
                className={
                  coupon.status === "active"
                    ? "status-badge status-active"
                    : "status-badge status-paused"
                }
              >
                {coupon.status === "active" ? "Ativo" : "Inativo"}
              </span>
              <strong>{coupon.code}</strong>
              <div>
                <span>Inicio</span>
                <strong>{shortDate(coupon.starts_at)}</strong>
              </div>
              <div>
                <span>Fim</span>
                <strong>{shortDate(coupon.ends_at)}</strong>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
