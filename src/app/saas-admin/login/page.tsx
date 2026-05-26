import { saasAdminLoginAction } from "@/app/actions/auth";
import { LoginForm } from "@/components/login-form";

export default function SaasAdminLoginPage() {
  return (
    <main className="login-page">
      <section className="login-panel">
        <p className="eyebrow">Admin global do SaaS</p>
        <h1>Entrar no SaaS Admin</h1>
        <p className="muted">
          Acesso restrito para gerenciar empresas, usuarios globais e plataforma.
        </p>
        <LoginForm
          action={saasAdminLoginAction}
          notice="Admin bootstrap: admin@influencersaas.local / admin123456"
          submitLabel="Entrar como admin SaaS"
        />
      </section>
    </main>
  );
}
