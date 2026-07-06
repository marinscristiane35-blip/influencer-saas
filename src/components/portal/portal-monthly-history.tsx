import { money } from "@/components/influencers/format";
import type { InfluencerMonthlySummaryRow } from "@/lib/orders/repository";

function monthLabel(value: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    month: "short",
    year: "numeric",
  }).format(value);
}

export function PortalMonthlyHistory({
  history,
}: {
  history: InfluencerMonthlySummaryRow[];
}) {
  return (
    <section className="form-panel elevated-panel section-gap">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Historico mensal</p>
          <h2>Vendas e comissoes por mes</h2>
        </div>
        <span className="panel-chip">{history.length} meses</span>
      </div>
      <div className="portal-history-list">
        {history.map((month) => (
          <article className="portal-history-card" key={month.month_start.toISOString()}>
            <strong>{monthLabel(month.month_start)}</strong>
            <div>
              <span>Vendido</span>
              <strong>{money(month.gross_amount)}</strong>
            </div>
            <div>
              <span>Comissao</span>
              <strong>{money(month.commission_amount)}</strong>
            </div>
            <div>
              <span>Pedidos</span>
              <strong>{month.orders_count.toString()}</strong>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
