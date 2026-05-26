const rolePermissions = {
  owner: ["company:manage", "users:manage", "admin:access"],
  admin: ["users:manage", "admin:access"],
  finance: ["admin:access", "finance:manage"],
  operator: ["admin:access"],
} as const;

export type Role = keyof typeof rolePermissions;
export type Permission = (typeof rolePermissions)[Role][number];

export function can(role: string, permission: Permission) {
  const permissions = new Set<string>(rolePermissions[role as Role] ?? []);

  return permissions.has(permission);
}
