import { prisma } from "@/lib/database/prisma";
import { requireSaasAdmin } from "@/lib/auth/guards";

export default async function SaasAdminUsersPage() {
  await requireSaasAdmin();

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <>
      <header className="topbar">
        <div>
          <p className="eyebrow">Admin global</p>
          <h1>Usuarios globais</h1>
        </div>
      </header>

      <section className="form-panel">
        {users.map((user) => (
          <p key={user.id}>
            <strong>{user.name}</strong>{" "}
            <span className="muted">{user.email}</span>
          </p>
        ))}
      </section>
    </>
  );
}
