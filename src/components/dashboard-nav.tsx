"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { companyLogoutAction } from "@/app/actions/auth";

const links = [
  { href: "/dashboard", label: "Visao geral" },
  { href: "/dashboard/influenciadores", label: "Influenciadores" },
  { href: "/dashboard/campanhas", label: "Campanhas" },
  { href: "/dashboard/configuracoes", label: "Configuracoes" },
];

function isActive(pathname: string, href: string) {
  return href === "/dashboard" ? pathname === href : pathname.startsWith(href);
}

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="dashboard-nav" aria-label="Dashboard da empresa">
      <div className="dashboard-nav-links">
        {links.map((link) => (
          <Link
            aria-current={isActive(pathname, link.href) ? "page" : undefined}
            className="dashboard-nav-link"
            href={link.href}
            key={link.href}
          >
            {link.label}
          </Link>
        ))}
      </div>
      <form action={companyLogoutAction}>
        <button className="dashboard-logout" type="submit">
          Sair
        </button>
      </form>
    </nav>
  );
}
