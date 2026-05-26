import { redirect } from "next/navigation";
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

  return {
    companyId: membership.companyId,
    userId: membership.userId,
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
