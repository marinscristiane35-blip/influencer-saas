import Link from "next/link";

export function InfluencerNotFound() {
  return (
    <section className="form-panel elevated-panel">
      <p className="eyebrow">Influenciador</p>
      <h2>Perfil nao encontrado</h2>
      <p className="muted">
        Este influenciador nao existe ou nao pertence a esta empresa.
      </p>
      <Link className="text-link" href="/dashboard/influenciadores">
        Voltar para influenciadores
      </Link>
    </section>
  );
}
