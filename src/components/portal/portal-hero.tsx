import { influencerLogoutAction } from "@/app/actions/auth";
import { money } from "@/components/influencers/format";

export function PortalHero({
  commission,
  coupon,
  insight,
  name,
  ordersCount,
  soldAmount,
}: {
  commission: string;
  coupon: string | null;
  insight: string;
  name: string;
  ordersCount: number;
  soldAmount: string;
}) {
  const firstName = name.split(" ")[0] || name;

  return (
    <section className="portal-hero">
      <div>
        <p className="eyebrow">Portal do influenciador</p>
        <h2>Ola, {firstName}</h2>
        <p>
          Acompanhe suas vendas com cupom, comissoes, campanhas liberadas e
          saldo em uma visao simples.
        </p>
        <div className="portal-coupon">
          <span>Cupom principal</span>
          <strong>{coupon ?? "-"}</strong>
        </div>
      </div>

      <article className="portal-main-card">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Comissao do mes</p>
            <strong>{money(commission)}</strong>
          </div>
          <form action={influencerLogoutAction}>
            <button className="secondary-button" type="submit">
              Sair
            </button>
          </form>
        </div>
        <div className="portal-main-grid">
          <div>
            <span>Valor comissionavel</span>
            <strong>{money(soldAmount)}</strong>
          </div>
          <div>
            <span>Pedidos do mes</span>
            <strong>{ordersCount}</strong>
          </div>
        </div>
        <p>{insight}</p>
      </article>
    </section>
  );
}
