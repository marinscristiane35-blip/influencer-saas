import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/database/prisma";
import { findInfluencerPortalAccountContext } from "@/lib/influencers/portal-account-repository";

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

  if (!session?.companyId || !session.influencerId || !session.portalAccountId) {
    redirect("/portal/login");
  }

  const account = await findInfluencerPortalAccountContext({
    accountId: session.portalAccountId,
    companyId: session.companyId,
    influencerId: session.influencerId,
  });

  if (
    !account ||
    account.status !== "active" ||
    account.influencer_status === "paused" ||
    account.influencer_status === "declined" ||
    account.influencer_archived_at
  ) {
    redirect("/portal/login");
  }

  return {
    accountId: account.id,
    companyId: account.company_id,
    companyName: account.company_name,
    companySlug: account.company_slug,
    influencer: {
      archived_at: account.influencer_archived_at,
      company_id: account.company_id,
      coupon_code: account.influencer_coupon_code,
      created_at: account.influencer_created_at,
      email: account.influencer_email,
      id: account.influencer_id,
      instagram: account.influencer_instagram,
      name: account.influencer_name,
      notes: account.influencer_notes,
      phone: account.influencer_phone,
      status: account.influencer_status,
      updated_at: account.influencer_updated_at,
    },
    influencerId: account.influencer_id,
    role: session.role,
  };
}

export {
  requireAnyCompanyPermission,
  requireCompanyPermission,
  requireTenant as requireCompanyUser,
} from "@/lib/tenant/context";
