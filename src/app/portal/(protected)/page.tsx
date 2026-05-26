import { requireInfluencer } from "@/lib/auth/guards";

const statusLabels = {
  active: "Ativo",
  invited: "Convidado",
  paused: "Pausado",
  declined: "Recusado",
} as const;

export default async function PortalHomePage() {
  const context = await requireInfluencer();

  const cards = [
    { detail: "Em breve", label: "Campanhas", value: "0" },
    { detail: "Resultados consolidados", label: "Resultados", value: "0" },
    { detail: "Saldo previsto", label: "Carteira", value: "R$ 0,00" },
  ];

  return (
    <>
      <section className="page-heading">
        <p className="eyebrow">{context.companyName}</p>
        <h2>Resumo do portal</h2>
        <p className="muted">
          Acompanhe suas campanhas, links, resultados e carteira quando os
          modulos forem ativados pela empresa.
        </p>
      </section>

      <section className="metric-grid">
        <article className="metric-card">
          <p>Empresa vinculada</p>
          <div className="metric">{context.companyName}</div>
          <span>{context.companySlug}</span>
        </article>
        <article className="metric-card">
          <p>Status</p>
          <div className="metric">{statusLabels[context.influencer.status]}</div>
          <span>Acesso individual do influenciador</span>
        </article>
        {cards.map((card) => (
          <article className="metric-card" key={card.label}>
            <p>{card.label}</p>
            <div className="metric">{card.value}</div>
            <span>{card.detail}</span>
          </article>
        ))}
      </section>
    </>
  );
}
