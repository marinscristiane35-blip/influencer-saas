import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/database/prisma";
import { findInfluencerPortalContext } from "@/lib/influencers/repository";

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

export async function requireInfluencer() {
  const session = await getSession("influencer");

  if (!session?.companyId || !session.influencerId) {
    redirect("/portal/login");
  }

  const influencer = await findInfluencerPortalContext({
    companyId: session.companyId,
    influencerId: session.influencerId,
  });

  if (!influencer) {
    redirect("/portal/login");
  }

  return {
    companyId: influencer.company_id,
    companyName: influencer.company_name,
    companySlug: influencer.company_slug,
    influencer,
    influencerId: influencer.id,
    role: session.role,
  };
}

export { requireTenant as requireCompanyUser } from "@/lib/tenant/context";
