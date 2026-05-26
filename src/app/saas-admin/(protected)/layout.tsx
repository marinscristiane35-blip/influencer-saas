import Link from "next/link";
import { saasAdminLogoutAction } from "@/app/actions/auth";
import { requireSaasAdmin } from "@/lib/auth/guards";

const links = [
  { href: "/saas-admin", label: "Dashboard" },
  { href: "/saas-admin/empresas", label: "Empresas" },
  { href: "/saas-admin/usuarios", label: "Usuarios globais" },
  { href: "/saas-admin/configuracoes", label: "Configuracoes" },
];

export default async function SaasAdminProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const admin = await requireSaasAdmin();

  return (
    <div className="shell">
      <aside className="sidebar">
        <p className="brand">SaaS Admin</p>
        <p className="eyebrow">{admin.user.email}</p>
        <nav className="nav" aria-label="SaaS Admin">
          {links.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
          <form action={saasAdminLogoutAction}>
            <button type="submit">Sair</button>
          </form>
        </nav>
      </aside>
      <main className="content">{children}</main>
    </div>
  );
}
