import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/database/prisma";

function getAllowedSaasAdminEmails() {
  const configured = process.env.SAAS_ADMIN_EMAILS?.split(",") ?? [];
  const emails = configured.map((email) => email.trim().toLowerCase()).filter(Boolean);

  return emails.length > 0 ? emails : ["admin@influencersaas.local"];
}

export async function requireSaasAdmin() {
  const session = await getSession("saas_admin");

  if (!session) {
    redirect("/saas-admin/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
  });

  if (!user || !getAllowedSaasAdminEmails().includes(user.email.toLowerCase())) {
    redirect("/saas-admin/login");
  }

  return {
    role: session.role,
    user,
    userId: user.id,
  };
}

export { requireTenant as requireCompanyUser } from "@/lib/tenant/context";
