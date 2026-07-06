import { prisma } from "@/lib/database/prisma";
import { requireSaasAdmin } from "@/lib/auth/guards";
import { createCompanyAction } from "@/app/actions/companies";
import { CompanyForm } from "@/components/company-form";

export default async function SaasAdminCompaniesPage() {
  await requireSaasAdmin();

  const companies = await prisma.company.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <>
      <header className="topbar">
        <div>
          <p className="eyebrow">Admin global</p>
          <h1>Empresas</h1>
        </div>
      </header>

      <div className="two-column">
        <section className="form-panel">
          <p className="eyebrow">Nova empresa</p>
          <h2>Cadastrar empresa</h2>
          <CompanyForm action={createCompanyAction} />
        </section>

        <section className="form-panel">
          <p className="eyebrow">Plataforma</p>
          <h2>Empresas cadastradas</h2>
          {companies.length === 0 ? (
            <p className="muted">Nenhuma empresa cadastrada.</p>
          ) : (
            companies.map((company) => (
              <p key={company.id}>
                <strong>{company.name}</strong>{" "}
                <span className="muted">
                  /{company.slug} - {company.status} - {company.plan}
                </span>
              </p>
            ))
          )}
        </section>
      </div>
    </>
  );
}
