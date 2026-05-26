import Link from "next/link";
import { influencerLogoutAction } from "@/app/actions/auth";
import { requireInfluencer } from "@/lib/auth/guards";

const links = [
  { href: "/portal", label: "Resumo" },
  { href: "/portal/campanhas", label: "Campanhas" },
  { href: "/portal/resultados", label: "Resultados" },
  { href: "/portal/carteira", label: "Carteira" },
  { href: "/portal/perfil", label: "Perfil" },
];

export default async function PortalProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const context = await requireInfluencer();

  return (
    <div className="shell">
      <aside className="sidebar portal-sidebar">
        <div className="dashboard-brand">
          <span className="brand-mark">IP</span>
          <div>
            <p className="brand dashboard-brand-name">Portal</p>
            <p className="eyebrow">Influenciador</p>
          </div>
        </div>
        <div className="tenant-card">
          <p className="eyebrow">Empresa</p>
          <strong>{context.companyName}</strong>
          <span>{context.influencer.name}</span>
        </div>
        <nav className="nav" aria-label="Portal do influenciador">
          {links.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
          <form action={influencerLogoutAction}>
            <button type="submit">Sair</button>
          </form>
        </nav>
      </aside>
      <main className="content dashboard-content">
        <div className="topbar dashboard-topbar">
          <div>
            <p className="eyebrow">Portal do influenciador</p>
            <h1>{context.influencer.name}</h1>
          </div>
          <span className="admin-chip">{context.influencer.status}</span>
        </div>
        {children}
      </main>
    </div>
  );
}
