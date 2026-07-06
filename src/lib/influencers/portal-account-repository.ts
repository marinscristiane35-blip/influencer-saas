import "server-only";

import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/database/prisma";

export type InfluencerPortalAccountStatus = "active" | "inactive";

export type InfluencerPortalAccountRow = {
  id: string;
  company_id: string;
  influencer_id: string;
  email: string;
  password_hash: string;
  status: InfluencerPortalAccountStatus;
  last_login_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

export type InfluencerPortalAccountContextRow = InfluencerPortalAccountRow & {
  influencer_name: string;
  influencer_email: string;
  influencer_phone: string | null;
  influencer_instagram: string | null;
  influencer_status: "active" | "invited" | "paused" | "declined";
  influencer_coupon_code: string | null;
  influencer_notes: string | null;
  influencer_archived_at: Date | null;
  influencer_created_at: Date;
  influencer_updated_at: Date;
  company_name: string;
  company_slug: string;
};

export async function listInfluencerPortalAccountsForLogin(email: string) {
  return prisma.$queryRaw<InfluencerPortalAccountContextRow[]>`
    SELECT
      influencer_portal_accounts.id,
      influencer_portal_accounts.company_id,
      influencer_portal_accounts.influencer_id,
      influencer_portal_accounts.email,
      influencer_portal_accounts.password_hash,
      influencer_portal_accounts.status,
      influencer_portal_accounts.last_login_at,
      influencer_portal_accounts.created_at,
      influencer_portal_accounts.updated_at,
      influencers.name AS influencer_name,
      influencers.email AS influencer_email,
      influencers.phone AS influencer_phone,
      influencers.instagram AS influencer_instagram,
      influencers.status AS influencer_status,
      influencers.coupon_code AS influencer_coupon_code,
      influencers.notes AS influencer_notes,
      influencers.archived_at AS influencer_archived_at,
      influencers.created_at AS influencer_created_at,
      influencers.updated_at AS influencer_updated_at,
      companies.name AS company_name,
      companies.slug AS company_slug
    FROM influencer_portal_accounts
    INNER JOIN influencers
      ON influencers.company_id = influencer_portal_accounts.company_id
      AND influencers.id = influencer_portal_accounts.influencer_id
    INNER JOIN companies ON companies.id = influencer_portal_accounts.company_id
    WHERE lower(influencer_portal_accounts.email) = ${email.toLowerCase()}
    ORDER BY influencer_portal_accounts.created_at ASC
  `;
}

export async function findInfluencerPortalAccountContext(input: {
  accountId: string;
  companyId: string;
  influencerId: string;
}) {
  const rows = await prisma.$queryRaw<InfluencerPortalAccountContextRow[]>`
    SELECT
      influencer_portal_accounts.id,
      influencer_portal_accounts.company_id,
      influencer_portal_accounts.influencer_id,
      influencer_portal_accounts.email,
      influencer_portal_accounts.password_hash,
      influencer_portal_accounts.status,
      influencer_portal_accounts.last_login_at,
      influencer_portal_accounts.created_at,
      influencer_portal_accounts.updated_at,
      influencers.name AS influencer_name,
      influencers.email AS influencer_email,
      influencers.phone AS influencer_phone,
      influencers.instagram AS influencer_instagram,
      influencers.status AS influencer_status,
      influencers.coupon_code AS influencer_coupon_code,
      influencers.notes AS influencer_notes,
      influencers.archived_at AS influencer_archived_at,
      influencers.created_at AS influencer_created_at,
      influencers.updated_at AS influencer_updated_at,
      companies.name AS company_name,
      companies.slug AS company_slug
    FROM influencer_portal_accounts
    INNER JOIN influencers
      ON influencers.company_id = influencer_portal_accounts.company_id
      AND influencers.id = influencer_portal_accounts.influencer_id
    INNER JOIN companies ON companies.id = influencer_portal_accounts.company_id
    WHERE influencer_portal_accounts.id = ${input.accountId}
      AND influencer_portal_accounts.company_id = ${input.companyId}
      AND influencer_portal_accounts.influencer_id = ${input.influencerId}
    LIMIT 1
  `;

  return rows[0] ?? null;
}

export async function updateInfluencerPortalAccountLastLogin(input: {
  accountId: string;
  companyId: string;
}) {
  await prisma.$executeRaw`
    UPDATE influencer_portal_accounts
    SET last_login_at = now(),
        updated_at = now()
    WHERE id = ${input.accountId}
      AND company_id = ${input.companyId}
  `;
}

export async function findInfluencerPortalAccountByInfluencer(input: {
  companyId: string;
  influencerId: string;
}) {
  const rows = await prisma.$queryRaw<
    Omit<InfluencerPortalAccountRow, "password_hash">[]
  >`
    SELECT
      id,
      company_id,
      influencer_id,
      email,
      status,
      last_login_at,
      created_at,
      updated_at
    FROM influencer_portal_accounts
    WHERE company_id = ${input.companyId}
      AND influencer_id = ${input.influencerId}
    LIMIT 1
  `;

  return rows[0] ?? null;
}

export async function upsertInfluencerPortalAccount(input: {
  companyId: string;
  influencerId: string;
  email: string;
  passwordHash: string;
  status?: InfluencerPortalAccountStatus;
}) {
  const rows = await prisma.$queryRaw<InfluencerPortalAccountRow[]>`
    INSERT INTO influencer_portal_accounts (
      id,
      company_id,
      influencer_id,
      email,
      password_hash,
      status,
      updated_at
    )
    SELECT
      ${randomUUID()},
      ${input.companyId},
      ${input.influencerId},
      ${input.email},
      ${input.passwordHash},
      ${input.status ?? "active"}::"InfluencerPortalAccountStatus",
      now()
    FROM influencers
    WHERE id = ${input.influencerId}
      AND company_id = ${input.companyId}
    ON CONFLICT (company_id, influencer_id)
    DO UPDATE SET
      email = EXCLUDED.email,
      password_hash = EXCLUDED.password_hash,
      status = EXCLUDED.status,
      updated_at = now()
    RETURNING
      id,
      company_id,
      influencer_id,
      email,
      password_hash,
      status,
      last_login_at,
      created_at,
      updated_at
  `;

  return rows[0] ?? null;
}
