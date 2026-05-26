"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireTenant } from "@/lib/tenant/context";
import { prisma } from "@/lib/database/prisma";

const companySchema = z.object({
  name: z.string().min(2),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/),
});

export async function createCompanyAction(_: unknown, formData: FormData) {
  const tenant = await requireTenant();

  if (tenant.role !== "owner") {
    return { error: "Apenas proprietarios podem cadastrar empresas." };
  }

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
      members: {
        create: {
          userId: tenant.userId,
          role: "owner",
          status: "active",
        },
      },
    },
  });

  revalidatePath("/admin/empresas");
  return { success: "Empresa cadastrada." };
}
