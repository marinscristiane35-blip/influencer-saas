import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import { requireTenant } from "@/lib/tenant/context";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/empresas", label: "Empresas" },
  { href: "/admin/usuarios", label: "Usuarios" },
  { href: "/admin/configuracoes", label: "Configuracoes" },
];

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const tenant = await requireTenant();

  return (
    <div className="shell">
      <aside className="sidebar">
        <p className="brand">Influencer SaaS</p>
        <p className="eyebrow">{tenant.company.name}</p>
        <nav className="nav" aria-label="Admin">
          {links.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
          <form action={logoutAction}>
            <button type="submit">Sair</button>
          </form>
        </nav>
      </aside>
      <main className="content">{children}</main>
    </div>
  );
}
