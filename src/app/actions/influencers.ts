"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { normalizeEmail } from "@/lib/auth/email";
import {
  createInfluencer,
  findInfluencerDuplicate,
} from "@/lib/influencers/repository";
import { requireTenant } from "@/lib/tenant/context";

const influencerSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome."),
  email: z.string().trim().email("Informe um e-mail valido."),
  phone: z.string().trim().optional(),
  instagram: z.string().trim().optional(),
  status: z.enum(["active", "invited", "paused", "declined"]),
  couponCode: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

function emptyToNull(value?: string) {
  return value && value.length > 0 ? value : null;
}

function normalizeCoupon(value?: string) {
  const coupon = emptyToNull(value);

  return coupon ? coupon.toUpperCase() : null;
}

function normalizeInstagram(value?: string) {
  const instagram = emptyToNull(value);

  if (!instagram) {
    return null;
  }

  return instagram.replace(/^@/, "").toLowerCase();
}

export async function createInfluencerAction(_: unknown, formData: FormData) {
  const tenant = await requireTenant();
  const parsed = influencerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    instagram: formData.get("instagram"),
    status: formData.get("status"),
    couponCode: formData.get("couponCode"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados invalidos." };
  }

  const email = normalizeEmail(parsed.data.email);
  const instagram = normalizeInstagram(parsed.data.instagram);
  const couponCode = normalizeCoupon(parsed.data.couponCode);

  const duplicate = await findInfluencerDuplicate({
    companyId: tenant.companyId,
    email,
    instagram,
    couponCode,
  });

  if (duplicate) {
    return {
      error:
        "Ja existe um influenciador nesta empresa com o mesmo e-mail, Instagram ou cupom.",
    };
  }

  await createInfluencer({
    companyId: tenant.companyId,
    name: parsed.data.name,
    email,
    phone: emptyToNull(parsed.data.phone),
    instagram,
    status: parsed.data.status,
    couponCode,
    notes: emptyToNull(parsed.data.notes),
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/influenciadores");
  return { success: "Influenciador cadastrado." };
}
