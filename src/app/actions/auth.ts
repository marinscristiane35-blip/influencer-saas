"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createSession, destroySession } from "@/lib/auth/session";
import { verifyPassword } from "@/lib/auth/password";
import { normalizeEmail } from "@/lib/auth/email";
import { prisma } from "@/lib/database/prisma";
import {
  listInfluencerPortalAccountsForLogin,
  updateInfluencerPortalAccountLastLogin,
} from "@/lib/influencers/portal-account-repository";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

function getAllowedSaasAdminEmails() {
  const configured = process.env.SAAS_ADMIN_EMAILS?.split(",") ?? [];
  const emails = configured.map((email) => email.trim().toLowerCase()).filter(Boolean);

  return emails.length > 0 ? emails : ["admin@influencersaas.local"];
}

export async function companyLoginAction(_: unknown, formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Informe e-mail e senha validos." };
  }

  const email = normalizeEmail(parsed.data.email);

  const user = await prisma.user.findFirst({
    where: {
      email: {
        equals: email,
        mode: "insensitive",
      },
    },
    include: {
      memberships: {
        where: { status: "active" },
        include: { company: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return { error: "Credenciais invalidas." };
  }

  const membership = user.memberships[0];

  if (!membership) {
    return { error: "Usuario sem empresa ativa." };
  }

  await destroySession("saas_admin");
  await destroySession("influencer");
  await createSession({
    sessionType: "company_user",
    userId: user.id,
    companyId: membership.companyId,
    role: membership.role,
  });

  redirect("/dashboard");
}

export async function saasAdminLoginAction(_: unknown, formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Informe e-mail e senha validos." };
  }

  const email = normalizeEmail(parsed.data.email);

  if (!getAllowedSaasAdminEmails().includes(email)) {
    return { error: "Usuario sem permissao de admin SaaS." };
  }

  const user = await prisma.user.findFirst({
    where: {
      email: {
        equals: email,
        mode: "insensitive",
      },
    },
  });

  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return { error: "Credenciais invalidas." };
  }

  await destroySession("company_user");
  await destroySession("influencer");
  await createSession({
    sessionType: "saas_admin",
    userId: user.id,
    role: "platform_admin",
  });

  redirect("/saas-admin");
}

export async function logoutAction() {
  await destroySession();
  redirect("/empresa/login");
}

export async function companyLogoutAction() {
  await destroySession("company_user");
  redirect("/empresa/login");
}

export async function saasAdminLogoutAction() {
  await destroySession("saas_admin");
  redirect("/saas-admin/login");
}

export async function influencerLoginAction(_: unknown, formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Informe e-mail e senha validos." };
  }

  const accounts = await listInfluencerPortalAccountsForLogin(
    normalizeEmail(parsed.data.email),
  );
  const matchingAccounts = [];

  for (const account of accounts) {
    if (
      account.status !== "active" ||
      account.influencer_status === "paused" ||
      account.influencer_status === "declined" ||
      account.influencer_archived_at
    ) {
      continue;
    }

    if (await verifyPassword(parsed.data.password, account.password_hash)) {
      matchingAccounts.push(account);
    }
  }

  const account = matchingAccounts.length === 1 ? matchingAccounts[0] : null;

  if (!account) {
    return { error: "Credenciais invalidas." };
  }

  await updateInfluencerPortalAccountLastLogin({
    accountId: account.id,
    companyId: account.company_id,
  });

  await destroySession("company_user");
  await destroySession("saas_admin");
  await createSession({
    companyId: account.company_id,
    influencerId: account.influencer_id,
    portalAccountId: account.id,
    role: "influencer",
    sessionType: "influencer",
  });

  redirect("/portal");
}

export async function influencerLogoutAction() {
  await destroySession("influencer");
  redirect("/portal/login");
}
