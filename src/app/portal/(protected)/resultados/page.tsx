import { requireInfluencer } from "@/lib/auth/guards";

export default async function PortalResultsPage() {
  await requireInfluencer();

  return (
    <section className="form-panel elevated-panel">
      <p className="eyebrow">Resultados</p>
      <h2>Performance</h2>
      <p className="muted">
        Cliques, vendas e indicadores ficarao nesta area quando as metricas
        forem implementadas.
      </p>
    </section>
  );
}
