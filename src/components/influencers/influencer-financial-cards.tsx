import { money } from "@/components/influencers/format";

export function InfluencerFinancialCards({
  attributedOrdersCount,
  averageTicket,
  canViewFinance,
  currentMonthCommission,
  wallet,
}: {
  attributedOrdersCount: number;
  averageTicket: string;
  canViewFinance: boolean;
  currentMonthCommission: string;
  wallet: {
    available_balance: string;
    pending_balance: string;
    total_received: string;
  } | null;
}) {
  if (!canViewFinance) {
    return (
      <section className="form-panel elevated-panel section-gap">
        <p className="eyebrow">Financeiro</p>
        <h2>Dados financeiros restritos</h2>
        <p className="muted">
          Seu acesso permite operar o relacionamento, mas nao visualizar saldos
          e comissoes sensiveis.
        </p>
      </section>
    );
  }

  const metrics = [
    ["Saldo disponivel", money(wallet?.available_balance), "Liberado no ledger."],
    ["Saldo pendente", money(wallet?.pending_balance), "Aguardando liberacao."],
    ["Total recebido", money(wallet?.total_received), "Creditos liberados."],
    ["Comissao do mes", money(currentMonthCommission), "Eventos do mes atual."],
    [("Pedidos atribuidos"), attributedOrdersCount.toString(), "Ultimos pedidos com cupom."],
    ["Ticket medio", money(averageTicket), "Base futura para analise."],
  ];

  return (
    <section className="metric-grid section-gap">
      {metrics.map(([label, value, detail]) => (
        <article className="metric-card" key={label}>
          <p>{label}</p>
          <div className="metric">{value}</div>
          <span>{detail}</span>
        </article>
      ))}
    </section>
  );
}
