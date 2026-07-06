import type { InfluencerCommissionOrderRow } from "@/lib/orders/repository";
import { money, shortDate } from "@/components/influencers/format";

export function InfluencerCommissionsTable({
  commissions,
}: {
  commissions: InfluencerCommissionOrderRow[];
}) {
  return (
    <section className="form-panel elevated-panel section-gap">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Comissoes</p>
          <h2>Comissoes recentes</h2>
        </div>
        <span className="panel-chip">{commissions.length} eventos</span>
      </div>
      {commissions.length === 0 ? (
        <div className="empty-state">
          <strong>Nenhuma comissao gerada</strong>
          <p>Eventos de comissao aparecerao aqui apos o matching por cupom.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Data</th>
                <th>Percentual</th>
                <th>Valor</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {commissions.map((commission) => (
                <tr key={commission.commission_id}>
                  <td>{commission.external_id}</td>
                  <td>{shortDate(commission.ordered_at)}</td>
                  <td>
                    {commission.commission_rate
                      ? `${commission.commission_rate}%`
                      : "-"}
                  </td>
                  <td>{money(commission.commission_amount)}</td>
                  <td>
                    <span className="status-badge status-draft">
                      {commission.commission_status}
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
