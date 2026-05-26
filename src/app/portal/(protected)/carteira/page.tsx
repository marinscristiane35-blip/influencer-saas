import { requireInfluencer } from "@/lib/auth/guards";
import { getInfluencerCommissionSummary } from "@/lib/orders/service";
import { getInfluencerWalletStatement } from "@/lib/wallet/service";

const typeLabels = {
  adjustment: "Ajuste",
  bonus: "Bonus",
  commission: "Comissao",
  payout: "Saque",
  refund: "Estorno",
} as const;

const statusLabels = {
  available: "Disponivel",
  cancelled: "Cancelada",
  pending: "Pendente",
  reversed: "Estornada",
} as const;

function money(value: string) {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency",
  }).format(Number(value));
}

function signedAmount(direction: "credit" | "debit", amount: string) {
  const prefix = direction === "credit" ? "+" : "-";

  return `${prefix} ${money(amount)}`;
}

export default async function PortalWalletPage() {
  const context = await requireInfluencer();
  const statement = await getInfluencerWalletStatement({
    companyId: context.companyId,
    influencerId: context.influencerId,
  });
  const commissionSummary = await getInfluencerCommissionSummary({
    companyId: context.companyId,
    influencerId: context.influencerId,
  });

  return (
    <>
      <section className="page-heading compact-heading">
        <p className="eyebrow">Carteira</p>
        <h2>Saldo e extrato</h2>
        <p className="muted">
          Acompanhe os lancamentos financeiros vinculados ao seu perfil nesta
          empresa.
        </p>
      </section>

      <section className="metric-grid">
        <article className="metric-card">
          <p>Comissao do mes</p>
          <div className="metric">
            {money(commissionSummary.currentMonthCommission)}
          </div>
          <span>Pedidos com seu cupom neste mes.</span>
        </article>
        <article className="metric-card">
          <p>Saldo disponivel</p>
          <div className="metric">
            {money(statement.wallet.available_balance)}
          </div>
          <span>Valor liberado para uso futuro.</span>
        </article>
        <article className="metric-card">
          <p>Saldo pendente</p>
          <div className="metric">{money(statement.wallet.pending_balance)}</div>
          <span>Lancamentos ainda nao disponiveis.</span>
        </article>
        <article className="metric-card">
          <p>Total recebido</p>
          <div className="metric">{money(statement.wallet.total_received)}</div>
          <span>Total de creditos disponiveis registrados.</span>
        </article>
      </section>

      <section className="form-panel elevated-panel section-gap">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Pedidos</p>
            <h2>Comissoes recentes</h2>
          </div>
          <span className="panel-chip">
            {commissionSummary.recentOrders.length} pedidos
          </span>
        </div>
        {commissionSummary.recentOrders.length === 0 ? (
          <div className="empty-state">
            <strong>Nenhum pedido com cupom ainda</strong>
            <p>
              Quando pedidos importados usarem seu cupom, as comissoes
              aparecerao aqui.
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
                  <th>Venda</th>
                  <th>Comissao</th>
                </tr>
              </thead>
              <tbody>
                {commissionSummary.recentOrders.map((order) => (
                  <tr key={order.commission_id}>
                    <td>
                      <strong>{order.external_id}</strong>
                      {order.customer_email ? (
                        <span className="table-note">
                          {order.customer_email}
                        </span>
                      ) : null}
                    </td>
                    <td>
                      {new Intl.DateTimeFormat("pt-BR").format(
                        order.ordered_at,
                      )}
                    </td>
                    <td>{order.coupon_code ?? "-"}</td>
                    <td>{money(order.gross_amount)}</td>
                    <td>
                      <strong>{money(order.commission_amount)}</strong>
                      <span className="table-note">
                        {order.commission_status}
                      </span>
                    </td>
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
            <p className="eyebrow">Extrato</p>
            <h2>Transacoes</h2>
          </div>
          <span className="panel-chip">
            {statement.transactions.length} lancamentos
          </span>
        </div>
        {statement.transactions.length === 0 ? (
          <div className="empty-state">
            <strong>Nenhuma transacao registrada ainda</strong>
            <p>
              Quando a empresa registrar bonus ou ajustes, eles aparecerao aqui
              com o status do saldo.
            </p>
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
                {statement.transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td>
                      {new Intl.DateTimeFormat("pt-BR").format(
                        transaction.occurred_at,
                      )}
                    </td>
                    <td>{typeLabels[transaction.type]}</td>
                    <td>{transaction.description ?? "-"}</td>
                    <td>
                      <span className="status-badge status-draft">
                        {statusLabels[transaction.status]}
                      </span>
                    </td>
                    <td>
                      <strong>
                        {signedAmount(
                          transaction.direction,
                          transaction.amount,
                        )}
                      </strong>
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
