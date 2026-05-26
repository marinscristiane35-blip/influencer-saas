import { requireInfluencer } from "@/lib/auth/guards";

export default async function PortalCampaignsPage() {
  await requireInfluencer();

  return (
    <section className="form-panel elevated-panel">
      <p className="eyebrow">Campanhas</p>
      <h2>Suas campanhas</h2>
      <p className="muted">
        As campanhas vinculadas a este influenciador aparecerao aqui quando a
        relacao campanha-influenciador for criada.
      </p>
    </section>
  );
}
