import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/database/prisma";

export type InfluencerStatus = "active" | "invited" | "paused" | "declined";

export type InfluencerRow = {
  id: string;
  company_id: string;
  name: string;
  email: string;
  phone: string | null;
  instagram: string | null;
  status: InfluencerStatus;
  coupon_code: string | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
};

export type InfluencerPortalRow = InfluencerRow & {
  company_name: string;
  company_slug: string;
};

export async function listInfluencersByCompany(companyId: string) {
  return prisma.$queryRaw<InfluencerRow[]>`
    SELECT
      id,
      company_id,
      name,
      email,
      phone,
      instagram,
      status,
      coupon_code,
      notes,
      created_at,
      updated_at
    FROM influencers
    WHERE company_id = ${companyId}
    ORDER BY created_at DESC
  `;
}

export async function countInfluencersByCompany(companyId: string) {
  const rows = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*)::bigint AS count
    FROM influencers
    WHERE company_id = ${companyId}
  `;

  return Number(rows[0]?.count ?? 0);
}

export async function findInfluencerDuplicate(input: {
  companyId: string;
  email: string;
  instagram: string | null;
  couponCode: string | null;
}) {
  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id
    FROM influencers
    WHERE company_id = ${input.companyId}
      AND (
        email = ${input.email}
        OR (${input.instagram}::text IS NOT NULL AND instagram = ${input.instagram})
        OR (${input.couponCode}::text IS NOT NULL AND coupon_code = ${input.couponCode})
      )
    LIMIT 1
  `;

  return rows[0] ?? null;
}

export async function createInfluencer(input: {
  companyId: string;
  name: string;
  email: string;
  phone: string | null;
  instagram: string | null;
  status: InfluencerStatus;
  couponCode: string | null;
  notes: string | null;
}) {
  const id = randomUUID();

  await prisma.$executeRaw`
    INSERT INTO influencers (
      id,
      company_id,
      name,
      email,
      phone,
      instagram,
      status,
      coupon_code,
      notes,
      updated_at
    )
    VALUES (
      ${id},
      ${input.companyId},
      ${input.name},
      ${input.email},
      ${input.phone},
      ${input.instagram},
      ${input.status}::"InfluencerStatus",
      ${input.couponCode},
      ${input.notes},
      now()
    )
  `;

  return { id };
}

export async function findInfluencerForLogin(email: string) {
  const rows = await prisma.$queryRaw<InfluencerPortalRow[]>`
    SELECT
      influencers.id,
      influencers.company_id,
      influencers.name,
      influencers.email,
      influencers.phone,
      influencers.instagram,
      influencers.status,
      influencers.coupon_code,
      influencers.notes,
      influencers.created_at,
      influencers.updated_at,
      companies.name AS company_name,
      companies.slug AS company_slug
    FROM influencers
    INNER JOIN companies ON companies.id = influencers.company_id
    WHERE influencers.email = ${email}
      AND influencers.status IN ('active', 'invited')
    ORDER BY influencers.created_at ASC
    LIMIT 1
  `;

  return rows[0] ?? null;
}

export async function findInfluencerPortalContext(input: {
  companyId: string;
  influencerId: string;
}) {
  const rows = await prisma.$queryRaw<InfluencerPortalRow[]>`
    SELECT
      influencers.id,
      influencers.company_id,
      influencers.name,
      influencers.email,
      influencers.phone,
      influencers.instagram,
      influencers.status,
      influencers.coupon_code,
      influencers.notes,
      influencers.created_at,
      influencers.updated_at,
      companies.name AS company_name,
      companies.slug AS company_slug
    FROM influencers
    INNER JOIN companies ON companies.id = influencers.company_id
    WHERE influencers.id = ${input.influencerId}
      AND influencers.company_id = ${input.companyId}
      AND influencers.status IN ('active', 'invited')
    LIMIT 1
  `;

  return rows[0] ?? null;
}
