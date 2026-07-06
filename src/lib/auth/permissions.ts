export const companyRoles = ["owner", "admin", "finance", "operator"] as const;

export type CompanyRole = (typeof companyRoles)[number];

export const companyPermissions = [
  "dashboard:view",
  "influencers:view",
  "influencers:create",
  "influencers:update",
  "influencers:status",
  "influencers:archive",
  "campaigns:view",
  "campaigns:create",
  "campaigns:update",
  "campaigns:manage",
  "content:view",
  "content:review",
  "challenges:view",
  "challenges:manage",
  "ranking:view",
  "crm:view",
  "crm:manage",
  "finance:view_summary",
  "finance:view_sensitive",
  "finance:import_orders",
  "finance:manual_transactions",
  "finance:settings",
  "users:view",
  "users:manage",
  "company:settings",
  "company:billing",
] as const;

export type CompanyPermission = (typeof companyPermissions)[number];

export const roleLabels: Record<CompanyRole, string> = {
  admin: "Empresa Admin",
  finance: "Financeiro",
  operator: "Empresa Operacional",
  owner: "Proprietario",
};

const adminPermissions = [
  "dashboard:view",
  "influencers:view",
  "influencers:create",
  "influencers:update",
  "influencers:status",
  "influencers:archive",
  "campaigns:view",
  "campaigns:create",
  "campaigns:update",
  "campaigns:manage",
  "content:view",
  "content:review",
  "challenges:view",
  "challenges:manage",
  "ranking:view",
  "crm:view",
  "crm:manage",
  "finance:view_summary",
  "finance:view_sensitive",
  "finance:import_orders",
  "finance:manual_transactions",
  "finance:settings",
  "users:view",
  "users:manage",
  "company:settings",
] satisfies CompanyPermission[];

const operationalPermissions = [
  "dashboard:view",
  "influencers:view",
  "influencers:create",
  "influencers:update",
  "influencers:status",
  "campaigns:view",
  "content:view",
  "content:review",
  "challenges:view",
  "ranking:view",
  "crm:view",
  "crm:manage",
] satisfies CompanyPermission[];

const rolePermissionMatrix = {
  admin: adminPermissions,
  finance: [
    "dashboard:view",
    "influencers:view",
    "campaigns:view",
    "ranking:view",
    "finance:view_summary",
    "finance:view_sensitive",
    "finance:import_orders",
    "finance:manual_transactions",
    "finance:settings",
  ],
  operator: operationalPermissions,
  owner: [...adminPermissions, "company:billing"],
} satisfies Record<CompanyRole, readonly CompanyPermission[]>;

export type PermissionOverride = {
  allowed: boolean;
  permission: string;
};

export function isCompanyRole(role: string): role is CompanyRole {
  return companyRoles.includes(role as CompanyRole);
}

export function isCompanyPermission(
  permission: string,
): permission is CompanyPermission {
  return companyPermissions.includes(permission as CompanyPermission);
}

export function getRolePermissions(role: string) {
  if (!isCompanyRole(role)) {
    return [] satisfies CompanyPermission[];
  }

  return [...rolePermissionMatrix[role]];
}

export function resolveCompanyPermissions(input: {
  role: string;
  overrides?: PermissionOverride[];
}) {
  const permissions = new Set<string>(getRolePermissions(input.role));

  for (const override of input.overrides ?? []) {
    if (!isCompanyPermission(override.permission)) {
      continue;
    }

    if (override.allowed) {
      permissions.add(override.permission);
    } else {
      permissions.delete(override.permission);
    }
  }

  return permissions;
}

export function canCompany(
  roleOrPermissions: string | Set<string> | readonly string[],
  permission: CompanyPermission,
) {
  const permissions =
    typeof roleOrPermissions === "string"
      ? resolveCompanyPermissions({ role: roleOrPermissions })
      : new Set(roleOrPermissions);

  return permissions.has(permission);
}

export function can(role: string, permission: CompanyPermission) {
  return canCompany(role, permission);
}
