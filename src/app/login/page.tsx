import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <main className="login-page">
      <section className="login-panel">
        <p className="eyebrow">Acesso administrativo</p>
        <h1>Entrar no Influencer SaaS</h1>
        <p className="muted">
          Use a conta da sua empresa para acessar o painel multiempresa.
        </p>
        <LoginForm />
      </section>
    </main>
  );
}
