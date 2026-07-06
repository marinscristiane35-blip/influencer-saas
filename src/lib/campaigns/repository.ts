import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/database/prisma";

export type CampaignStatus = "draft" | "active" | "paused" | "finished";
export type CampaignInfluencerStatus =
  | "invited"
  | "active"
  | "paused"
  | "finished";

export type CampaignRow = {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  objective: string | null;
  status: CampaignStatus;
  starts_at: Date | null;
  ends_at: Date | null;
  planned_budget: string | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
};

export type CampaignInfluencerRow = {
  id: string;
  company_id: string;
  campaign_id: string;
  influencer_id: string;
  status: CampaignInfluencerStatus;
  created_at: Date;
  updated_at: Date;
  influencer_name: string;
  influencer_email: string;
  influencer_status: string;
  influencer_coupon_code: string | null;
};

export type InfluencerCampaignRow = CampaignRow & {
  link_id: string;
  link_status: CampaignInfluencerStatus;
  coupon_codes: string | null;
};

export async function listCampaignsByCompany(companyId: string) {
  return prisma.$queryRaw<CampaignRow[]>`
    SELECT
      id,
      company_id,
      name,
      description,
      objective,
      status,
      starts_at,
      ends_at,
      planned_budget::text,
      notes,
      created_at,
      updated_at
    FROM campaigns
    WHERE company_id = ${companyId}
    ORDER BY created_at DESC
  `;
}

export async function listCampaignInfluencersByCompany(companyId: string) {
  return prisma.$queryRaw<CampaignInfluencerRow[]>`
    SELECT
      campaign_influencers.id,
      campaign_influencers.company_id,
      campaign_influencers.campaign_id,
      campaign_influencers.influencer_id,
      campaign_influencers.status,
      campaign_influencers.created_at,
      campaign_influencers.updated_at,
      influencers.name AS influencer_name,
      influencers.email AS influencer_email,
      influencers.status::text AS influencer_status,
      influencers.coupon_code AS influencer_coupon_code
    FROM campaign_influencers
    INNER JOIN influencers
      ON influencers.company_id = campaign_influencers.company_id
      AND influencers.id = campaign_influencers.influencer_id
    WHERE campaign_influencers.company_id = ${companyId}
    ORDER BY campaign_influencers.created_at DESC
  `;
}

export async function linkInfluencerToCampaign(input: {
  companyId: string;
  campaignId: string;
  influencerId: string;
  status?: CampaignInfluencerStatus;
}) {
  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    INSERT INTO campaign_influencers (
      id,
      company_id,
      campaign_id,
      influencer_id,
      status,
      updated_at
    )
    SELECT
      ${randomUUID()},
      ${input.companyId},
      campaigns.id,
      influencers.id,
      ${input.status ?? "active"}::"CampaignInfluencerStatus",
      now()
    FROM campaigns
    INNER JOIN influencers ON influencers.company_id = campaigns.company_id
    WHERE campaigns.company_id = ${input.companyId}
      AND campaigns.id = ${input.campaignId}
      AND influencers.id = ${input.influencerId}
      AND influencers.archived_at IS NULL
    ON CONFLICT (company_id, campaign_id, influencer_id)
    DO UPDATE SET
      status = EXCLUDED.status,
      updated_at = now()
    RETURNING id
  `;

  return rows[0] ?? null;
}

export async function unlinkInfluencerFromCampaign(input: {
  companyId: string;
  campaignId: string;
  influencerId: string;
}) {
  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    DELETE FROM campaign_influencers
    WHERE company_id = ${input.companyId}
      AND campaign_id = ${input.campaignId}
      AND influencer_id = ${input.influencerId}
    RETURNING id
  `;

  return rows[0] ?? null;
}

export async function listCampaignsForInfluencer(input: {
  companyId: string;
  influencerId: string;
}) {
  return prisma.$queryRaw<InfluencerCampaignRow[]>`
    SELECT
      campaigns.id,
      campaigns.company_id,
      campaigns.name,
      campaigns.description,
      campaigns.objective,
      campaigns.status,
      campaigns.starts_at,
      campaigns.ends_at,
      campaigns.planned_budget::text,
      campaigns.notes,
      campaigns.created_at,
      campaigns.updated_at,
      campaign_influencers.id AS link_id,
      campaign_influencers.status AS link_status,
      coupon_summary.coupon_codes
    FROM campaign_influencers
    INNER JOIN campaigns
      ON campaigns.company_id = campaign_influencers.company_id
      AND campaigns.id = campaign_influencers.campaign_id
    LEFT JOIN LATERAL (
      SELECT string_agg(code, ', ' ORDER BY created_at DESC) AS coupon_codes
      FROM influencer_coupons
      WHERE company_id = campaign_influencers.company_id
        AND influencer_id = campaign_influencers.influencer_id
        AND status = 'active'
    ) coupon_summary ON true
    WHERE campaign_influencers.company_id = ${input.companyId}
      AND campaign_influencers.influencer_id = ${input.influencerId}
      AND campaign_influencers.status IN ('invited', 'active')
    ORDER BY campaigns.starts_at DESC NULLS LAST, campaigns.created_at DESC
  `;
}

export async function countActiveCampaignsByCompany(companyId: string) {
  const rows = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*)::bigint AS count
    FROM campaigns
    WHERE company_id = ${companyId}
      AND status = 'active'
  `;

  return Number(rows[0]?.count ?? 0);
}

export async function countCampaignsByCompany(companyId: string) {
  const rows = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*)::bigint AS count
    FROM campaigns
    WHERE company_id = ${companyId}
  `;

  return Number(rows[0]?.count ?? 0);
}

export async function createCampaign(input: {
  companyId: string;
  name: string;
  description: string | null;
  objective: string | null;
  status: CampaignStatus;
  startsAt: Date | null;
  endsAt: Date | null;
  plannedBudget: string | null;
  notes: string | null;
}) {
  await prisma.$executeRaw`
    INSERT INTO campaigns (
      id,
      company_id,
      name,
      description,
      objective,
      status,
      starts_at,
      ends_at,
      planned_budget,
      notes,
      updated_at
    )
    VALUES (
      ${randomUUID()},
      ${input.companyId},
      ${input.name},
      ${input.description},
      ${input.objective},
      ${input.status}::"CampaignStatus",
      ${input.startsAt},
      ${input.endsAt},
      ${input.plannedBudget}::decimal,
      ${input.notes},
      now()
    )
  `;
}
