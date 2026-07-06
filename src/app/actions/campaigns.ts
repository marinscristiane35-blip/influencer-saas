"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createCampaign } from "@/lib/campaigns/repository";
import { requireCompanyPermission } from "@/lib/tenant/context";

const campaignSchema = z
  .object({
    name: z.string().trim().min(2, "Informe o nome da campanha."),
    description: z.string().trim().optional(),
    objective: z.string().trim().optional(),
    status: z.enum(["draft", "active", "paused", "finished"]),
    startsAt: z.string().trim().optional(),
    endsAt: z.string().trim().optional(),
    plannedBudget: z.string().trim().optional(),
    notes: z.string().trim().optional(),
  })
  .refine(
    (data) => {
      if (!data.startsAt || !data.endsAt) {
        return true;
      }

      return new Date(data.startsAt) <= new Date(data.endsAt);
    },
    {
      message: "A data de fim precisa ser posterior ao inicio.",
      path: ["endsAt"],
    },
  );

function emptyToNull(value?: string) {
  return value && value.length > 0 ? value : null;
}

function dateOrNull(value?: string) {
  return value && value.length > 0 ? new Date(`${value}T00:00:00`) : null;
}

function budgetOrNull(value?: string) {
  const budget = emptyToNull(value?.replace(",", "."));

  if (!budget) {
    return null;
  }

  return Number(budget) >= 0 ? budget : null;
}

export async function createCampaignAction(_: unknown, formData: FormData) {
  const tenant = await requireCompanyPermission("campaigns:create");
  const parsed = campaignSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    objective: formData.get("objective"),
    status: formData.get("status"),
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
    plannedBudget: formData.get("plannedBudget"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados invalidos." };
  }

  await createCampaign({
    companyId: tenant.companyId,
    name: parsed.data.name,
    description: emptyToNull(parsed.data.description),
    objective: emptyToNull(parsed.data.objective),
    status: parsed.data.status,
    startsAt: dateOrNull(parsed.data.startsAt),
    endsAt: dateOrNull(parsed.data.endsAt),
    plannedBudget: budgetOrNull(parsed.data.plannedBudget),
    notes: emptyToNull(parsed.data.notes),
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/campanhas");
  return { success: "Campanha cadastrada." };
}
