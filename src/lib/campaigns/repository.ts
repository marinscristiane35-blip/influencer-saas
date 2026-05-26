import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/database/prisma";

export type CampaignStatus = "draft" | "active" | "paused" | "finished";

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
