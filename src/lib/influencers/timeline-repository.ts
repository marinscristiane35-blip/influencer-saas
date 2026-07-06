import "server-only";

import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/database/prisma";

export type InfluencerTimelineEventRow = {
  id: string;
  company_id: string;
  influencer_id: string;
  user_id: string | null;
  type: string;
  title: string;
  description: string | null;
  metadata: unknown | null;
  created_at: Date;
};

export async function createInfluencerTimelineEvent(input: {
  companyId: string;
  influencerId: string;
  userId: string | null;
  type: string;
  title: string;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  const metadata = input.metadata ? JSON.stringify(input.metadata) : null;
  const rows = await prisma.$queryRaw<InfluencerTimelineEventRow[]>`
    INSERT INTO influencer_timeline_events (
      id,
      company_id,
      influencer_id,
      user_id,
      type,
      title,
      description,
      metadata
    )
    SELECT
      ${randomUUID()},
      ${input.companyId},
      ${input.influencerId},
      ${input.userId},
      ${input.type},
      ${input.title},
      ${input.description ?? null},
      ${metadata}::jsonb
    FROM influencers
    WHERE id = ${input.influencerId}
      AND company_id = ${input.companyId}
    RETURNING
      id,
      company_id,
      influencer_id,
      user_id,
      type,
      title,
      description,
      metadata,
      created_at
  `;

  return rows[0] ?? null;
}

export async function listInfluencerTimelineEvents(input: {
  companyId: string;
  influencerId: string;
  limit?: number;
}) {
  const limit = Math.min(Math.max(input.limit ?? 30, 1), 100);

  return prisma.$queryRaw<InfluencerTimelineEventRow[]>`
    SELECT
      id,
      company_id,
      influencer_id,
      user_id,
      type,
      title,
      description,
      metadata,
      created_at
    FROM influencer_timeline_events
    WHERE company_id = ${input.companyId}
      AND influencer_id = ${input.influencerId}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;
}
