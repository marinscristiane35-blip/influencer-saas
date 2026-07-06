"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { companyLogoutAction } from "@/app/actions/auth";
import type { CompanyPermission } from "@/lib/auth/permissions";

const links = [
  { href: "/dashboard", label: "Visao geral", permission: "dashboard:view" },
  {
    href: "/dashboard/influenciadores",
    label: "Influenciadores",
    permission: "influencers:view",
  },
  {
    href: "/dashboard/campanhas",
    label: "Campanhas",
    permission: "campaigns:view",
  },
  {
    href: "/dashboard/cupons",
    label: "Cupons",
    permission: "influencers:view",
  },
  {
    href: "/dashboard/financeiro",
    label: "Financeiro",
    permission: "finance:view_sensitive",
  },
  {
    href: "/dashboard/configuracoes",
    label: "Configuracoes",
    permission: "company:settings",
  },
] satisfies Array<{
  href: string;
  label: string;
  permission: CompanyPermission;
}>;

function isActive(pathname: string, href: string) {
  return href === "/dashboard" ? pathname === href : pathname.startsWith(href);
}

export function DashboardNav({
  permissions,
}: {
  permissions: string[];
}) {
  const pathname = usePathname();
  const allowed = new Set(permissions);

  return (
    <nav className="dashboard-nav" aria-label="Dashboard da empresa">
      <div className="dashboard-nav-links">
        {links
          .filter((link) => allowed.has(link.permission))
          .map((link) => (
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
