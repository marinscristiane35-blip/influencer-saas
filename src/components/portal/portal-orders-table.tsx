import { money, shortDate } from "@/components/influencers/format";
import type { InfluencerCouponOrderRow } from "@/lib/orders/repository";

const orderStatusLabels = {
  cancelled: "Cancelado",
  paid: "Pago",
  pending: "Pendente",
  refunded: "Reembolsado",
} as const;

export function PortalOrdersTable({
  orders,
}: {
  orders: InfluencerCouponOrderRow[];
}) {
  return (
    <section className="form-panel elevated-panel section-gap">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Pedidos por cupom</p>
          <h2>Pedidos importados com seus codigos</h2>
        </div>
        <span className="panel-chip">{orders.length} recentes</span>
      </div>
      {orders.length === 0 ? (
        <div className="empty-state">
          <strong>Nenhum pedido com seu cupom ainda</strong>
          <p>
            Assim que a empresa importar pedidos usando seus cupons, eles
            aparecerao aqui com a comissao correspondente.
          </p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Data</th>
                <th>Cupom</th>
                <th>Status</th>
                <th>Valor</th>
                <th>Comissao</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.order_id}>
                  <td>
                    <strong>#{order.external_id}</strong>
                    {order.customer_email ? (
                      <span className="table-note">{order.customer_email}</span>
                    ) : null}
                  </td>
                  <td>{shortDate(order.ordered_at)}</td>
                  <td>{order.coupon_code ?? "-"}</td>
                  <td>{orderStatusLabels[order.status]}</td>
                  <td>{money(order.gross_amount)}</td>
                  <td>
                    <strong>{money(order.commission_amount ?? 0)}</strong>
                    <span className="table-note">
                      {order.commission_status ?? "Sem comissao gerada"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
