"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireInfluencer } from "@/lib/auth/guards";
import {
  createChallenge,
  createChallengeScore,
  createChallengeSubmission,
  reviewChallengeSubmission,
} from "@/lib/challenges/repository";
import { requireCompanyPermission } from "@/lib/tenant/context";

const challengeSchema = z.object({
  description: z.string().min(5),
  endsAt: z.string().optional(),
  prizeDescription: z.string().optional(),
  startsAt: z.string().optional(),
  status: z.enum(["draft", "active", "finished", "cancelled"]),
  title: z.string().min(3),
});

const submissionSchema = z.object({
  challengeId: z.string().min(1),
  description: z.string().min(5),
  linkUrl: z.string().url().optional().or(z.literal("")),
});

const reviewSchema = z.object({
  points: z.coerce.number().int().min(0).max(100000).default(0),
  reviewNote: z.string().optional(),
  status: z.enum(["approved", "rejected"]),
  submissionId: z.string().min(1),
});

const scoreSchema = z.object({
  challengeId: z.string().min(1),
  influencerId: z.string().min(1),
  note: z.string().optional(),
  points: z.coerce.number().int().min(-100000).max(100000),
});

function parseDate(value?: string) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

export async function createChallengeAction(_: unknown, formData: FormData) {
  const tenant = await requireCompanyPermission("challenges:manage");
  const parsed = challengeSchema.safeParse({
    description: formData.get("description"),
    endsAt: formData.get("endsAt"),
    prizeDescription: formData.get("prizeDescription"),
    startsAt: formData.get("startsAt"),
    status: formData.get("status") || "draft",
    title: formData.get("title"),
  });

  if (!parsed.success) {
    return { error: "Informe titulo, descricao e status validos." };
  }

  await createChallenge({
    companyId: tenant.companyId,
    description: parsed.data.description.trim(),
    endsAt: parseDate(parsed.data.endsAt),
    prizeDescription: parsed.data.prizeDescription?.trim() || null,
    startsAt: parseDate(parsed.data.startsAt),
    status: parsed.data.status,
    title: parsed.data.title.trim(),
  });

  revalidatePath("/dashboard/desafios");
  revalidatePath("/portal");
  revalidatePath("/portal/desafios");
  return { success: "Desafio criado." };
}

export async function submitChallengeAction(_: unknown, formData: FormData) {
  const context = await requireInfluencer();
  const parsed = submissionSchema.safeParse({
    challengeId: formData.get("challengeId"),
    description: formData.get("description"),
    linkUrl: formData.get("linkUrl"),
  });

  if (!parsed.success) {
    return { error: "Informe uma descricao e um link valido." };
  }

  const submission = await createChallengeSubmission({
    challengeId: parsed.data.challengeId,
    companyId: context.companyId,
    description: parsed.data.description.trim(),
    influencerId: context.influencerId,
    linkUrl: parsed.data.linkUrl?.trim() || null,
  });

  if (!submission) {
    return { error: "Desafio indisponivel para envio." };
  }

  revalidatePath("/portal");
  revalidatePath("/portal/desafios");
  redirect("/portal/desafios");
}

export async function reviewChallengeSubmissionAction(formData: FormData) {
  const tenant = await requireCompanyPermission("challenges:manage");
  const parsed = reviewSchema.safeParse({
    points: formData.get("points") || 0,
    reviewNote: formData.get("reviewNote"),
    status: formData.get("status"),
    submissionId: formData.get("submissionId"),
  });

  if (!parsed.success) {
    return;
  }

  const submission = await reviewChallengeSubmission({
    companyId: tenant.companyId,
    reviewNote: parsed.data.reviewNote?.trim() || null,
    status: parsed.data.status,
    submissionId: parsed.data.submissionId,
  });

  if (submission && parsed.data.status === "approved" && parsed.data.points > 0) {
    await createChallengeScore({
      challengeId: submission.challenge_id,
      companyId: tenant.companyId,
      influencerId: submission.influencer_id,
      note: parsed.data.reviewNote?.trim() || "Pontuacao por envio aprovado.",
      points: parsed.data.points,
      submissionId: submission.id,
    });
  }

  revalidatePath("/dashboard/desafios");
  revalidatePath(`/dashboard/influenciadores/${submission?.influencer_id ?? ""}`);
}

export async function createChallengeScoreAction(formData: FormData) {
  const tenant = await requireCompanyPermission("challenges:manage");
  const parsed = scoreSchema.safeParse({
    challengeId: formData.get("challengeId"),
    influencerId: formData.get("influencerId"),
    note: formData.get("note"),
    points: formData.get("points"),
  });

  if (!parsed.success) {
    return;
  }

  await createChallengeScore({
    challengeId: parsed.data.challengeId,
    companyId: tenant.companyId,
    influencerId: parsed.data.influencerId,
    note: parsed.data.note?.trim() || null,
    points: parsed.data.points,
  });

  revalidatePath("/dashboard/desafios");
  revalidatePath(`/dashboard/influenciadores/${parsed.data.influencerId}`);
}
