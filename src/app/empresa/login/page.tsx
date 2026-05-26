import { companyLoginAction } from "@/app/actions/auth";
import { LoginForm } from "@/components/login-form";

export default function CompanyLoginPage() {
  return (
    <main className="login-page">
      <section className="login-panel">
        <p className="eyebrow">Acesso da empresa</p>
        <h1>Entrar no dashboard</h1>
        <p className="muted">
          Use sua conta de empresa para gerenciar influenciadores, campanhas e
          metricas operacionais.
        </p>
        <LoginForm
          action={companyLoginAction}
          notice="Usuario seed: admin@influencersaas.local / admin123456"
        />
      </section>
    </main>
  );
}
