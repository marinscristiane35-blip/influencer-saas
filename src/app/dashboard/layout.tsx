import Link from "next/link";
import { companyLogoutAction } from "@/app/actions/auth";
import { getTenant } from "@/lib/tenant/context";
import { DashboardNav } from "@/components/dashboard-nav";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const tenant = await getTenant();

  if (!tenant) {
    return (
      <main className="login-page">
        <section className="login-panel">
          <p className="eyebrow">Empresa nao encontrada</p>
          <h1>Nenhuma empresa ativa vinculada</h1>
          <p className="muted">
            Seu usuario esta autenticado, mas ainda nao possui uma empresa ativa
            para operar. Peca a um administrador para vincular sua conta.
          </p>
          <form action={companyLogoutAction}>
            <button className="button" type="submit">
              Sair
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <div className="shell">
      <aside className="sidebar dashboard-sidebar">
        <div className="dashboard-brand">
          <span className="brand-mark">IS</span>
          <div>
            <p className="brand dashboard-brand-name">Influencer SaaS</p>
            <p className="eyebrow">Area operacional</p>
          </div>
        </div>
        <div className="tenant-card">
          <p className="eyebrow">Empresa atual</p>
          <strong>{tenant.company.name}</strong>
          <span>{tenant.company.slug}</span>
        </div>
        <DashboardNav />
      </aside>
      <main className="content dashboard-content">
        <div className="topbar dashboard-topbar">
          <div>
            <p className="eyebrow">Workspace</p>
            <h1>{tenant.company.name}</h1>
          </div>
          <Link className="admin-chip" href="/saas-admin">
            Admin global
          </Link>
        </div>
        {children}
      </main>
    </div>
  );
}
