import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/database/prisma";

export async function requireTenant() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
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
    redirect("/login");
  }

  return {
    companyId: membership.companyId,
    userId: membership.userId,
    role: membership.role,
    company: membership.company,
    user: membership.user,
  };
}
