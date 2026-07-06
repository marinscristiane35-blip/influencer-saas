"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSaasAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/database/prisma";

const companySchema = z.object({
  name: z.string().min(2),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/),
});

export async function createCompanyAction(_: unknown, formData: FormData) {
  await requireSaasAdmin();

  const parsed = companySchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
  });

  if (!parsed.success) {
    return { error: "Informe nome e slug validos." };
  }

  await prisma.company.create({
    data: {
      name: parsed.data.name,
      slug: parsed.data.slug,
    },
  });

  revalidatePath("/saas-admin/empresas");
  return { success: "Empresa cadastrada." };
}
