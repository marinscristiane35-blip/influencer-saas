import { ManualWalletTransactionForm } from "@/components/manual-wallet-transaction-form";
import { OrdersImportForm } from "@/components/orders-import-form";
import { listInfluencersByCompany } from "@/lib/influencers/repository";
import { getDashboardFinancialSummary } from "@/lib/orders/service";
import { requireCompanyPermission } from "@/lib/tenant/context";
import { listCompanyWallets } from "@/lib/wallet/service";

function money(value: string | number) {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency",
  }).format(Number(value));
}

export default async function DashboardFinancePage() {
  const tenant = await requireCompanyPermission("finance:view_sensitive");

  const [influencers, walletSummaries, importSummary] = await Promise.all([
    listInfluencersByCompany(tenant.companyId),
    listCompanyWallets(tenant.companyId),
    getDashboardFinancialSummary(tenant.companyId),
  ]);
  const walletsByInfluencer = new Map(
    walletSummaries.map((wallet) => [wallet.influencer_id, wallet]),
  );

  return (
    <>
      <section className="page-heading compact-heading">
        <p className="eyebrow">Financeiro</p>
        <h2>Carteiras dos influenciadores</h2>
        <p className="muted">
          Importe pedidos por CSV, gere comissoes por cupom e acompanhe os
          saldos das carteiras do tenant atual.
        </p>
      </section>

      <section className="metric-grid section-gap">
        <article className="metric-card">
          <p>Total importado</p>
          <div className="metric">
            {Number(importSummary.total_imported).toString()}
          </div>
          <span>Pedidos recebidos via planilha.</span>
        </article>
        <article className="metric-card">
          <p>Com cupom encontrado</p>
          <div className="metric">
            {Number(importSummary.matched_orders).toString()}
          </div>
          <span>Pedidos que geraram evento de comissao.</span>
        </article>
        <article className="metric-card">
          <p>Sem match</p>
          <div className="metric">
            {Number(importSummary.unmatched_orders).toString()}
          </div>
          <span>Pedidos sem comissao vinculada.</span>
        </article>
        <article className="metric-card">
          <p>Comissao gerada</p>
          <div className="metric">
            {money(importSummary.generated_commission ?? 0)}
          </div>
          <span>Total em eventos de comissao.</span>
        </article>
      </section>

      <div className="influencers-layout">
        <section className="form-panel elevated-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">{tenant.company.name}</p>
              <h2>Novo lancamento</h2>
            </div>
            <span className="panel-chip">Manual</span>
          </div>
          {influencers.length === 0 ? (
            <div className="empty-state">
              <strong>Nenhum influenciador cadastrado</strong>
              <p>
                Cadastre um influenciador antes de registrar transacoes de
                carteira.
              </p>
            </div>
          ) : (
            <ManualWalletTransactionForm
              influencers={influencers.map((influencer) => ({
                email: influencer.email,
                id: influencer.id,
                name: influencer.name,
              }))}
            />
          )}
        </section>

        <section className="form-panel elevated-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">CSV</p>
              <h2>Importar pedidos</h2>
            </div>
            <span className="panel-chip">Planilha</span>
          </div>
          <OrdersImportForm />
        </section>

        <section className="form-panel elevated-panel list-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Saldos</p>
              <h2>Influenciadores</h2>
            </div>
            <span className="panel-chip">
              {influencers.length} influenciadores
            </span>
          </div>
          {influencers.length === 0 ? (
            <div className="empty-state">
              <strong>Sem dados financeiros ainda</strong>
              <p>
                A carteira nasce quando o primeiro lancamento manual for
                registrado.
              </p>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Influenciador</th>
                    <th>Status</th>
                    <th>Disponivel</th>
                    <th>Pendente</th>
                    <th>Total recebido</th>
                  </tr>
                </thead>
                <tbody>
                  {influencers.map((influencer) => {
                    const wallet = walletsByInfluencer.get(influencer.id);

                    return (
                      <tr key={influencer.id}>
                        <td>
                          <strong>{influencer.name}</strong>
                          <span className="table-note">{influencer.email}</span>
                        </td>
                        <td>
                          <span className="status-badge status-draft">
                            {influencer.status}
                          </span>
                        </td>
                        <td>{money(wallet?.available_balance ?? 0)}</td>
                        <td>{money(wallet?.pending_balance ?? 0)}</td>
                        <td>{money(wallet?.total_received ?? 0)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
