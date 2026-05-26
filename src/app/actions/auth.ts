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

export async function loginAction(_: unknown, formData: FormData) {
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
    userId: user.id,
    companyId: membership.companyId,
    role: membership.role,
  });

  redirect("/admin");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
