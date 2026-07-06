"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { normalizeEmail } from "@/lib/auth/email";
import { hashPassword } from "@/lib/auth/password";
import {
  createInfluencerCoupon,
  syncInfluencerPrimaryCoupon,
} from "@/lib/financial/repository";
import { upsertInfluencerPortalAccount } from "@/lib/influencers/portal-account-repository";
import {
  archiveInfluencer,
  createInfluencer,
  findInfluencerByCompany,
  findInfluencerDuplicate,
  findInfluencerDuplicateForUpdate,
  unarchiveInfluencer,
  updateInfluencer,
  updateInfluencerStatus,
} from "@/lib/influencers/repository";
import { createInfluencerTimelineEvent } from "@/lib/influencers/timeline-repository";
import { requireCompanyPermission } from "@/lib/tenant/context";

const influencerSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome."),
  email: z.string().trim().email("Informe um e-mail valido."),
  phone: z.string().trim().optional(),
  instagram: z.string().trim().optional(),
  status: z.enum(["active", "invited", "paused", "declined"]),
  couponCode: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

const timelineNoteSchema = z.object({
  description: z.string().trim().min(3, "Escreva uma observacao."),
  influencerId: z.string().trim().min(1, "Influenciador invalido."),
});

const portalAccountSchema = z.object({
  email: z.string().trim().email("Informe um e-mail valido."),
  influencerId: z.string().trim().min(1, "Influenciador invalido."),
  password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres."),
  status: z.enum(["active", "inactive"]),
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
  const tenant = await requireCompanyPermission("influencers:create");
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

  const influencer = await createInfluencer({
    companyId: tenant.companyId,
    name: parsed.data.name,
    email,
    phone: emptyToNull(parsed.data.phone),
    instagram,
    status: parsed.data.status,
    couponCode,
    notes: emptyToNull(parsed.data.notes),
  });

  if (couponCode) {
    await createInfluencerCoupon({
      code: couponCode,
      companyId: tenant.companyId,
      influencerId: influencer.id,
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/influenciadores");
  return { success: "Influenciador cadastrado." };
}

export async function updateInfluencerAction(_: unknown, formData: FormData) {
  const tenant = await requireCompanyPermission("influencers:update");
  const influencerId = String(formData.get("influencerId") ?? "");
  const parsed = influencerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    instagram: formData.get("instagram"),
    status: formData.get("status"),
    couponCode: formData.get("couponCode"),
    notes: formData.get("notes"),
  });

  if (!influencerId) {
    return { error: "Influenciador invalido." };
  }

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados invalidos." };
  }

  const existing = await findInfluencerByCompany({
    companyId: tenant.companyId,
    influencerId,
  });

  if (!existing) {
    return { error: "Influenciador nao encontrado neste tenant." };
  }

  const email = normalizeEmail(parsed.data.email);
  const instagram = normalizeInstagram(parsed.data.instagram);
  const couponCode = normalizeCoupon(parsed.data.couponCode);
  const duplicate = await findInfluencerDuplicateForUpdate({
    companyId: tenant.companyId,
    couponCode,
    email,
    influencerId,
    instagram,
  });

  if (duplicate) {
    return {
      error:
        "Ja existe outro influenciador nesta empresa com o mesmo e-mail, Instagram ou cupom.",
    };
  }

  const updated = await updateInfluencer({
    companyId: tenant.companyId,
    couponCode,
    email,
    influencerId,
    instagram,
    name: parsed.data.name,
    notes: emptyToNull(parsed.data.notes),
    phone: emptyToNull(parsed.data.phone),
    status: parsed.data.status,
  });

  if (!updated) {
    return { error: "Nao foi possivel atualizar o influenciador." };
  }

  await syncInfluencerPrimaryCoupon({
    code: couponCode,
    companyId: tenant.companyId,
    influencerId,
  });

  await createInfluencerTimelineEvent({
    companyId: tenant.companyId,
    description: "Dados cadastrais atualizados pela empresa.",
    influencerId,
    metadata: {
      couponCode,
      email,
      instagram,
      previousCouponCode: existing.coupon_code,
      previousEmail: existing.email,
      previousInstagram: existing.instagram,
      previousStatus: existing.status,
      status: parsed.data.status,
    },
    title: "Perfil atualizado",
    type: "profile_update",
    userId: tenant.userId,
  });

  revalidatePath("/dashboard/influenciadores");
  revalidatePath(`/dashboard/influenciadores/${influencerId}`);
  return { success: "Influenciador atualizado." };
}

export async function changeInfluencerStatusAction(formData: FormData) {
  const intent = String(formData.get("intent") ?? "");
  const tenant = await requireCompanyPermission(
    intent === "archive" || intent === "unarchive"
      ? "influencers:archive"
      : "influencers:status",
  );
  const influencerId = String(formData.get("influencerId") ?? "");
  const statusByIntent = {
    pause: "paused",
    reactivate: "active",
  } as const;
  const status = statusByIntent[intent as keyof typeof statusByIntent];

  if (!influencerId) {
    return;
  }

  const existing = await findInfluencerByCompany({
    companyId: tenant.companyId,
    influencerId,
  });

  if (!existing) {
    return;
  }

  if (intent === "archive") {
    await archiveInfluencer({
      companyId: tenant.companyId,
      influencerId,
    });
    await createInfluencerTimelineEvent({
      companyId: tenant.companyId,
      description: "Influenciador removido da listagem operacional ativa.",
      influencerId,
      metadata: { previousArchivedAt: existing.archived_at },
      title: "Influenciador arquivado",
      type: "archived",
      userId: tenant.userId,
    });
  } else if (intent === "unarchive") {
    await unarchiveInfluencer({
      companyId: tenant.companyId,
      influencerId,
    });
    await createInfluencerTimelineEvent({
      companyId: tenant.companyId,
      description: "Influenciador voltou para a listagem operacional ativa.",
      influencerId,
      metadata: { previousArchivedAt: existing.archived_at },
      title: "Influenciador desarquivado",
      type: "unarchived",
      userId: tenant.userId,
    });
  } else if (status) {
    await updateInfluencerStatus({
      companyId: tenant.companyId,
      influencerId,
      status,
    });
    await createInfluencerTimelineEvent({
      companyId: tenant.companyId,
      description: `Status alterado de ${existing.status} para ${status}.`,
      influencerId,
      metadata: { previousStatus: existing.status, status },
      title: "Status alterado",
      type: "status_change",
      userId: tenant.userId,
    });
  }

  revalidatePath("/dashboard/influenciadores");
  revalidatePath(`/dashboard/influenciadores/${influencerId}`);
}

export async function createInfluencerNoteAction(_: unknown, formData: FormData) {
  const tenant = await requireCompanyPermission("influencers:update");
  const parsed = timelineNoteSchema.safeParse({
    description: formData.get("description"),
    influencerId: formData.get("influencerId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados invalidos." };
  }

  const influencer = await findInfluencerByCompany({
    companyId: tenant.companyId,
    influencerId: parsed.data.influencerId,
  });

  if (!influencer) {
    return { error: "Influenciador nao encontrado neste tenant." };
  }

  await createInfluencerTimelineEvent({
    companyId: tenant.companyId,
    description: parsed.data.description,
    influencerId: influencer.id,
    title: "Observacao interna",
    type: "note",
    userId: tenant.userId,
  });

  revalidatePath(`/dashboard/influenciadores/${influencer.id}`);
  return { success: "Observacao adicionada." };
}

export async function upsertInfluencerPortalAccountAction(
  _: unknown,
  formData: FormData,
) {
  const tenant = await requireCompanyPermission("influencers:update");
  const parsed = portalAccountSchema.safeParse({
    email: formData.get("email"),
    influencerId: formData.get("influencerId"),
    password: formData.get("password"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados invalidos." };
  }

  const influencer = await findInfluencerByCompany({
    companyId: tenant.companyId,
    influencerId: parsed.data.influencerId,
  });

  if (!influencer) {
    return { error: "Influenciador nao encontrado neste tenant." };
  }

  let account;

  try {
    account = await upsertInfluencerPortalAccount({
      companyId: tenant.companyId,
      email: normalizeEmail(parsed.data.email),
      influencerId: influencer.id,
      passwordHash: await hashPassword(parsed.data.password),
      status: parsed.data.status,
    });
  } catch {
    return {
      error:
        "Nao foi possivel salvar a conta. Verifique se este e-mail ja esta em uso nesta empresa.",
    };
  }

  if (!account) {
    return { error: "Nao foi possivel salvar a conta do portal." };
  }

  await createInfluencerTimelineEvent({
    companyId: tenant.companyId,
    description: "Conta de acesso ao portal criada ou atualizada.",
    influencerId: influencer.id,
    metadata: {
      email: account.email,
      status: account.status,
    },
    title: "Conta do portal atualizada",
    type: "portal_account_update",
    userId: tenant.userId,
  });

  revalidatePath(`/dashboard/influenciadores/${influencer.id}`);
  return { success: "Conta do portal salva." };
}
