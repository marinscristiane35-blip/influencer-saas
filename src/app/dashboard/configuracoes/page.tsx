import { requireCompanyPermission } from "@/lib/tenant/context";

export default async function DashboardSettingsPage() {
  const tenant = await requireCompanyPermission("company:settings");

  return (
    <section className="form-panel">
      <p className="eyebrow">Configuracoes da empresa</p>
      <h2>{tenant.company.name}</h2>
      <p>
        <strong>Slug:</strong> {tenant.company.slug}
      </p>
      <p>
        <strong>Status:</strong> {tenant.company.status}
      </p>
      <p>
        <strong>Seu papel:</strong> {tenant.role}
      </p>
    </section>
  );
}
