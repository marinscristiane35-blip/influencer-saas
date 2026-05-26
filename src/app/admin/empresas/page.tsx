import { createCompanyAction } from "@/app/actions/companies";
import { prisma } from "@/lib/database/prisma";
import { requireTenant } from "@/lib/tenant/context";
import { CompanyForm } from "@/components/company-form";

export default async function CompaniesPage() {
  const tenant = await requireTenant();

  const memberships = await prisma.companyMember.findMany({
    where: { userId: tenant.userId, status: "active" },
    include: { company: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <header className="topbar">
        <div>
          <p className="eyebrow">Multiempresa</p>
          <h1>Empresas</h1>
        </div>
      </header>

      <section className="grid">
        <div className="form-panel">
          <h2>Nova empresa</h2>
          <CompanyForm action={createCompanyAction} />
        </div>

        <div className="form-panel">
          <h2>Ultimas empresas</h2>
          {memberships.length === 0 ? (
            <p className="muted">Nenhuma empresa cadastrada.</p>
          ) : (
            memberships.map((membership) => (
              <p key={membership.companyId}>
                <strong>{membership.company.name}</strong>{" "}
                <span className="muted">/{membership.company.slug}</span>
              </p>
            ))
          )}
        </div>
      </section>
    </>
  );
}
