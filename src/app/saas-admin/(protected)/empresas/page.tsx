import { prisma } from "@/lib/database/prisma";
import { requireSaasAdmin } from "@/lib/auth/guards";
import { createCompanyAction } from "@/app/actions/companies";
import { CompanyForm } from "@/components/company-form";

export default async function SaasAdminCompaniesPage() {
  await requireSaasAdmin();

  const companies = await prisma.company.findMany({
    include: {
      members: {
        include: {
          user: {
            select: {
              email: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
        take: 1,
        where: { role: "owner" },
      },
    },
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
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Empresa</th>
                    <th>Responsavel</th>
                    <th>Status</th>
                    <th>Plano</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map((company) => {
                    const owner = company.members[0]?.user;

                    return (
                      <tr key={company.id}>
                        <td>
                          <strong>{company.name}</strong>
                          <span className="table-note">/{company.slug}</span>
                        </td>
                        <td>
                          {owner ? (
                            <>
                              <strong>{owner.name}</strong>
                              <span className="table-note">{owner.email}</span>
                            </>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td>{company.status}</td>
                        <td>{company.plan}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
