"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSaasAdmin } from "@/lib/auth/guards";
import { normalizeEmail } from "@/lib/auth/email";
import { hashPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/database/prisma";

const companySchema = z.object({
  name: z.string().min(2),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/),
  adminName: z.string().min(2),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(8),
  status: z.enum(["active", "inactive", "suspended"]).default("active"),
});

export async function createCompanyAction(_: unknown, formData: FormData) {
  await requireSaasAdmin();

  const parsed = companySchema.safeParse({
    name: formData.get("name"),
    slug: String(formData.get("slug") ?? "").trim().toLowerCase(),
    adminName: formData.get("adminName"),
    adminEmail: formData.get("adminEmail"),
    adminPassword: formData.get("adminPassword"),
    status: formData.get("status") || "active",
  });

  if (!parsed.success) {
    return { error: "Informe os dados da empresa e do administrador." };
  }

  const adminEmail = normalizeEmail(parsed.data.adminEmail);
  const [existingCompany, existingUser] = await Promise.all([
    prisma.company.findUnique({
      where: { slug: parsed.data.slug },
      select: { id: true },
    }),
    prisma.user.findUnique({
      where: { email: adminEmail },
      select: { id: true },
    }),
  ]);

  if (existingCompany) {
    return { error: "Ja existe uma empresa com este slug." };
  }

  if (existingUser) {
    return { error: "Ja existe um usuario com este e-mail." };
  }

  const passwordHash = await hashPassword(parsed.data.adminPassword);

  try {
    await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name: parsed.data.name.trim(),
          slug: parsed.data.slug,
          status: parsed.data.status,
        },
        select: { id: true },
      });

      const user = await tx.user.create({
        data: {
          email: adminEmail,
          name: parsed.data.adminName.trim(),
          passwordHash,
        },
        select: { id: true },
      });

      await tx.companyMember.create({
        data: {
          companyId: company.id,
          role: "owner",
          status: "active",
          userId: user.id,
        },
      });
    });
  } catch {
    return {
      error:
        "Nao foi possivel cadastrar. Verifique se empresa, slug ou e-mail ja existem.",
    };
  }

  revalidatePath("/saas-admin/empresas");
  return { success: "Empresa e administrador cadastrados." };
}
