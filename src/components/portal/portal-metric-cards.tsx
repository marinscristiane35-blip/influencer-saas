import { money } from "@/components/influencers/format";

export function PortalMetricCards({
  availableBalance,
  currentMonthSold,
  primaryCoupon,
  rankingPosition,
  totalCommission,
}: {
  availableBalance: string;
  currentMonthSold: string;
  primaryCoupon: string | null;
  rankingPosition: number | null;
  totalCommission: string;
}) {
  return (
    <section className="metric-grid section-gap">
      <article className="metric-card">
        <p>Total vendido no mes</p>
        <div className="metric">{money(currentMonthSold)}</div>
        <span>Pedidos pagos importados com seus cupons.</span>
      </article>
      <article className="metric-card">
        <p>Comissao acumulada</p>
        <div className="metric">{money(totalCommission)}</div>
        <span>Soma das comissoes geradas no historico.</span>
      </article>
      <article className="metric-card">
        <p>Saldo disponivel</p>
        <div className="metric">{money(availableBalance)}</div>
        <span>Saldo liberado na carteira.</span>
      </article>
      <article className="metric-card">
        <p>Cupom ativo</p>
        <div className="metric">{primaryCoupon ?? "-"}</div>
        <span>Use este codigo nas divulgacoes.</span>
      </article>
      <article className="metric-card">
        <p>Ranking mensal</p>
        <div className="metric">
          {rankingPosition ? `#${rankingPosition}` : "-"}
        </div>
        <span>
          {rankingPosition
            ? "Posicao por vendas com cupom neste mes."
            : "Sera exibido quando houver vendas suficientes."}
        </span>
      </article>
    </section>
  );
}
