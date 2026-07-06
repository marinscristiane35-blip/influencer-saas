import { redirect } from "next/navigation";
import {
  canCompany,
  resolveCompanyPermissions,
  type CompanyPermission,
  type PermissionOverride,
} from "@/lib/auth/permissions";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/database/prisma";

async function findTenant() {
  const session = await getSession("company_user");

  if (!session?.companyId) {
    return null;
  }

  const membership = await prisma.companyMember.findFirst({
    where: {
      companyId: session.companyId,
      userId: session.userId,
      status: "active",
    },
    include: {
      company: true,
      user: true,
    },
  });

  if (!membership) {
    return null;
  }

  const permissionOverrideRows = await prisma.$queryRaw<PermissionOverride[]>`
    SELECT permission, allowed
    FROM company_member_permissions
    WHERE company_id = ${membership.companyId}
      AND member_id = ${membership.id}
  `;
  const permissionOverrides = permissionOverrideRows.map(
    (override: PermissionOverride) =>
      ({
        allowed: override.allowed,
        permission: override.permission,
      }) satisfies PermissionOverride,
  );
  const permissions = resolveCompanyPermissions({
    overrides: permissionOverrides,
    role: membership.role,
  });

  return {
    can: (permission: CompanyPermission) => canCompany(permissions, permission),
    companyId: membership.companyId,
    userId: membership.userId,
    memberId: membership.id,
    permissions,
    permissionOverrides,
    role: membership.role,
    company: membership.company,
    user: membership.user,
  };
}

export async function getTenant() {
  const session = await getSession("company_user");

  if (!session) {
    redirect("/empresa/login");
  }

  return findTenant();
}

export async function requireTenant() {
  const tenant = await getTenant();

  if (!tenant) {
    redirect("/empresa/login");
  }

  return tenant;
}

export async function requireCompanyPermission(permission: CompanyPermission) {
  const tenant = await requireTenant();

  if (!tenant.can(permission)) {
    redirect("/dashboard");
  }

  return tenant;
}

export async function requireAnyCompanyPermission(
  permissions: CompanyPermission[],
) {
  const tenant = await requireTenant();

  if (!permissions.some((permission) => tenant.can(permission))) {
    redirect("/dashboard");
  }

  return tenant;
}
