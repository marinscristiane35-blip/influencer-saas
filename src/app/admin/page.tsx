import { prisma } from "@/lib/database/prisma";
import { requireTenant } from "@/lib/tenant/context";

export default async function AdminHomePage() {
  const tenant = await requireTenant();

  const [users, companies] = await Promise.all([
    prisma.companyMember.count({
      where: { companyId: tenant.companyId, status: "active" },
    }),
    prisma.companyMember.count({
      where: { userId: tenant.userId, status: "active" },
    }),
  ]);

  return (
    <>
      <header className="topbar">
        <div>
          <p className="eyebrow">Fundacao</p>
          <h1>Dashboard administrativo</h1>
        </div>
        <p className="muted">{tenant.user.name}</p>
      </header>

      <section className="grid">
        <article className="card">
          <p className="muted">Empresa atual</p>
          <div className="metric">{tenant.company.name}</div>
        </article>
        <article className="card">
          <p className="muted">Usuarios ativos</p>
          <div className="metric">{users}</div>
        </article>
        <article className="card">
          <p className="muted">Empresas acessiveis</p>
          <div className="metric">{companies}</div>
        </article>
      </section>
    </>
  );
}
