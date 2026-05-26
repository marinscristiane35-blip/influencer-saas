import { requireSaasAdmin } from "@/lib/auth/guards";

export default async function SaasAdminSettingsPage() {
  const admin = await requireSaasAdmin();

  return (
    <>
      <header className="topbar">
        <div>
          <p className="eyebrow">Plataforma</p>
          <h1>Configuracoes</h1>
        </div>
      </header>

      <section className="form-panel">
        <p>
          <strong>Tipo de sessao:</strong> saas_admin
        </p>
        <p>
          <strong>Admin:</strong> {admin.user.email}
        </p>
        <p className="muted">
          Configure `SAAS_ADMIN_EMAILS` no ambiente para liberar outros admins
          globais sem usar permissao de empresa.
        </p>
      </section>
    </>
  );
}
