import { prisma } from "@/lib/database/prisma";
import { requireTenant } from "@/lib/tenant/context";

export default async function UsersPage() {
  const tenant = await requireTenant();

  const members = await prisma.companyMember.findMany({
    where: { companyId: tenant.companyId },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <>
      <header className="topbar">
        <div>
          <p className="eyebrow">Permissoes</p>
          <h1>Usuarios da empresa</h1>
        </div>
      </header>

      <section className="form-panel">
        {members.map((member) => (
          <p key={member.id}>
            <strong>{member.user.name}</strong>{" "}
            <span className="muted">
              {member.user.email} - {member.role} - {member.status}
            </span>
          </p>
        ))}
      </section>
    </>
  );
}
