import Link from "next/link";
import type { InfluencerCommissionOrderRow } from "@/lib/orders/repository";
import { money, shortDate } from "@/components/influencers/format";

export function InfluencerOrdersTable({
  influencerId,
  orders,
}: {
  influencerId: string;
  orders: InfluencerCommissionOrderRow[];
}) {
  return (
    <section className="form-panel elevated-panel section-gap">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Pedidos</p>
          <h2>Pedidos por cupom</h2>
        </div>
        <span className="panel-chip">{orders.length} pedidos</span>
      </div>
      {orders.length === 0 ? (
        <div className="empty-state">
          <strong>Nenhum pedido importado com este cupom</strong>
          <p>Ao importar pedidos em Financeiro, o matching por cupom aparecera aqui.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Data</th>
                <th>Cupom</th>
                <th>Valor</th>
                <th>Comissao</th>
                <th>Origem</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.commission_id}>
                  <td>
                    <strong>{order.external_id}</strong>
                    {order.customer_email ? (
                      <span className="table-note">{order.customer_email}</span>
                    ) : null}
                  </td>
                  <td>{shortDate(order.ordered_at)}</td>
                  <td>{order.coupon_code ?? "-"}</td>
                  <td>{money(order.gross_amount)}</td>
                  <td>
                    <strong>{money(order.commission_amount)}</strong>
                    <span className="table-note">{order.commission_status}</span>
                  </td>
                  <td>
                    <Link
                      className="text-link"
                      href={`/dashboard/influenciadores/${influencerId}/comissoes/${order.commission_id}`}
                    >
                      Planilha
                    </Link>
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
