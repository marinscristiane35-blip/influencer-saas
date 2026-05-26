import { prisma } from "@/lib/database/prisma";
import { requireSaasAdmin } from "@/lib/auth/guards";

export default async function SaasAdminHomePage() {
  const admin = await requireSaasAdmin();

  const [companies, users, memberships] = await Promise.all([
    prisma.company.count(),
    prisma.user.count(),
    prisma.companyMember.count(),
  ]);

  return (
    <>
      <header className="topbar">
        <div>
          <p className="eyebrow">Admin global do SaaS</p>
          <h1>Plataforma</h1>
        </div>
        <p className="muted">{admin.user.name}</p>
      </header>

      <section className="grid">
        <article className="card">
          <p className="muted">Empresas cadastradas</p>
          <div className="metric">{companies}</div>
        </article>
        <article className="card">
          <p className="muted">Usuarios globais</p>
          <div className="metric">{users}</div>
        </article>
        <article className="card">
          <p className="muted">Vinculos empresa/usuario</p>
          <div className="metric">{memberships}</div>
        </article>
      </section>
    </>
  );
}
