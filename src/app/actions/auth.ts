"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createSession, destroySession } from "@/lib/auth/session";
import { verifyPassword } from "@/lib/auth/password";
import { normalizeEmail } from "@/lib/auth/email";
import { prisma } from "@/lib/database/prisma";

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
