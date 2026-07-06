import { InfluencerLoginForm } from "@/components/influencer-login-form";

export default function PortalLoginPage() {
  return (
    <main className="login-page">
      <section className="login-panel">
        <p className="eyebrow">Portal do influenciador</p>
        <h1>Entrar no portal</h1>
        <p className="muted">
          Use o e-mail e a senha definidos pela empresa para acessar campanhas,
          cupons, resultados e carteira.
        </p>
        <InfluencerLoginForm />
      </section>
    </main>
  );
}
