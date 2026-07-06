import type { WalletTransactionRow } from "@/lib/wallet/repository";
import { shortDate, signedAmount } from "@/components/influencers/format";

export function InfluencerTransactionsTable({
  transactions,
}: {
  transactions: WalletTransactionRow[];
}) {
  return (
    <section className="form-panel elevated-panel section-gap">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Extrato</p>
          <h2>Ultimas transacoes</h2>
        </div>
        <span className="panel-chip">{transactions.length}</span>
      </div>
      {transactions.length === 0 ? (
        <div className="empty-state">
          <strong>Sem transacoes</strong>
          <p>O extrato financeiro sera preservado mesmo se o perfil pausar.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Tipo</th>
                <th>Descricao</th>
                <th>Status</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td>{shortDate(transaction.occurred_at)}</td>
                  <td>{transaction.type}</td>
                  <td>{transaction.description ?? "-"}</td>
                  <td>{transaction.status}</td>
                  <td>
                    <strong>
                      {signedAmount(transaction.direction, transaction.amount)}
                    </strong>
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
