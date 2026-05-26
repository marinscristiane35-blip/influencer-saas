import { requireTenant } from "@/lib/tenant/context";

export default async function SettingsPage() {
  const tenant = await requireTenant();

  return (
    <>
      <header className="topbar">
        <div>
          <p className="eyebrow">Tenant context</p>
          <h1>Configuracoes</h1>
        </div>
      </header>

      <section className="form-panel">
        <p>
          <strong>Empresa:</strong> {tenant.company.name}
        </p>
        <p>
          <strong>Slug:</strong> {tenant.company.slug}
        </p>
        <p>
          <strong>Plano:</strong> {tenant.company.plan}
        </p>
        <p>
          <strong>Papel atual:</strong> {tenant.role}
        </p>
      </section>
    </>
  );
}
