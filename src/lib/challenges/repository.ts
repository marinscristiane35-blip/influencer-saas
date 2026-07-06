import "server-only";

import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/database/prisma";

export type InfluencerChallengeStatus =
  | "draft"
  | "active"
  | "finished"
  | "cancelled";
export type InfluencerChallengeSubmissionStatus =
  | "pending"
  | "approved"
  | "rejected";

export type ChallengeRow = {
  id: string;
  company_id: string;
  title: string;
  description: string;
  prize_description: string | null;
  status: InfluencerChallengeStatus;
  starts_at: Date | null;
  ends_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

export type CompanyChallengeRow = ChallengeRow & {
  participants_count: bigint;
  submissions_count: bigint;
  pending_submissions_count: bigint;
  leader_points: number | null;
};

export type PortalChallengeRow = ChallengeRow & {
  my_points: number;
  my_position: bigint | null;
  my_submissions_count: bigint;
};

export type ChallengeSubmissionRow = {
  id: string;
  company_id: string;
  challenge_id: string;
  influencer_id: string;
  description: string;
  link_url: string | null;
  file_url: string | null;
  status: InfluencerChallengeSubmissionStatus;
  review_note: string | null;
  reviewed_at: Date | null;
  created_at: Date;
  updated_at: Date;
  challenge_title: string;
  influencer_name: string;
  influencer_email: string;
};

export type ChallengeRankingRow = {
  influencer_id: string;
  influencer_name: string;
  influencer_coupon_code: string | null;
  total_points: number;
  position: bigint;
};

export type InfluencerChallengeParticipationRow = PortalChallengeRow & {
  latest_submission_status: InfluencerChallengeSubmissionStatus | null;
  latest_submission_link_url: string | null;
  latest_submission_created_at: Date | null;
};

export async function listCompanyChallenges(companyId: string) {
  return prisma.$queryRaw<CompanyChallengeRow[]>`
    SELECT
      influencer_challenges.id,
      influencer_challenges.company_id,
      influencer_challenges.title,
      influencer_challenges.description,
      influencer_challenges.prize_description,
      influencer_challenges.status,
      influencer_challenges.starts_at,
      influencer_challenges.ends_at,
      influencer_challenges.created_at,
      influencer_challenges.updated_at,
      COALESCE(stats.participants_count, 0)::bigint AS participants_count,
      COALESCE(stats.submissions_count, 0)::bigint AS submissions_count,
      COALESCE(stats.pending_submissions_count, 0)::bigint AS pending_submissions_count,
      stats.leader_points
    FROM influencer_challenges
    LEFT JOIN LATERAL (
      SELECT
        (
          SELECT COUNT(DISTINCT influencer_id)::bigint
          FROM influencer_challenge_submissions
          WHERE company_id = influencer_challenges.company_id
            AND challenge_id = influencer_challenges.id
        ) AS participants_count,
        (
          SELECT COUNT(id)::bigint
          FROM influencer_challenge_submissions
          WHERE company_id = influencer_challenges.company_id
            AND challenge_id = influencer_challenges.id
        ) AS submissions_count,
        (
          SELECT COUNT(id)::bigint
          FROM influencer_challenge_submissions
          WHERE company_id = influencer_challenges.company_id
            AND challenge_id = influencer_challenges.id
            AND status = 'pending'
        ) AS pending_submissions_count,
        MAX(score_totals.total_points) AS leader_points
      FROM influencer_challenges stats_challenge
      LEFT JOIN LATERAL (
        SELECT SUM(points)::int AS total_points
        FROM influencer_challenge_scores score_sum
        WHERE score_sum.company_id = influencer_challenges.company_id
          AND score_sum.challenge_id = influencer_challenges.id
        GROUP BY score_sum.influencer_id
      ) score_totals ON true
      WHERE stats_challenge.id = influencer_challenges.id
    ) stats ON true
    WHERE influencer_challenges.company_id = ${companyId}
    ORDER BY influencer_challenges.created_at DESC
  `;
}

export async function createChallenge(input: {
  companyId: string;
  title: string;
  description: string;
  prizeDescription: string | null;
  status: InfluencerChallengeStatus;
  startsAt: Date | null;
  endsAt: Date | null;
}) {
  await prisma.$executeRaw`
    INSERT INTO influencer_challenges (
      id,
      company_id,
      title,
      description,
      prize_description,
      status,
      starts_at,
      ends_at,
      updated_at
    )
    VALUES (
      ${randomUUID()},
      ${input.companyId},
      ${input.title},
      ${input.description},
      ${input.prizeDescription},
      ${input.status}::"InfluencerChallengeStatus",
      ${input.startsAt},
      ${input.endsAt},
      now()
    )
  `;
}

export async function findChallengeByCompany(input: {
  companyId: string;
  challengeId: string;
}) {
  const rows = await prisma.$queryRaw<ChallengeRow[]>`
    SELECT
      id,
      company_id,
      title,
      description,
      prize_description,
      status,
      starts_at,
      ends_at,
      created_at,
      updated_at
    FROM influencer_challenges
    WHERE company_id = ${input.companyId}
      AND id = ${input.challengeId}
    LIMIT 1
  `;

  return rows[0] ?? null;
}

export async function listPortalChallenges(input: {
  companyId: string;
  influencerId: string;
}) {
  return prisma.$queryRaw<PortalChallengeRow[]>`
    WITH ranking AS (
      SELECT
        challenge_id,
        influencer_id,
        SUM(points)::int AS total_points,
        RANK() OVER (
          PARTITION BY challenge_id
          ORDER BY SUM(points) DESC
        ) AS position
      FROM influencer_challenge_scores
      WHERE company_id = ${input.companyId}
      GROUP BY challenge_id, influencer_id
    )
    SELECT
      influencer_challenges.id,
      influencer_challenges.company_id,
      influencer_challenges.title,
      influencer_challenges.description,
      influencer_challenges.prize_description,
      influencer_challenges.status,
      influencer_challenges.starts_at,
      influencer_challenges.ends_at,
      influencer_challenges.created_at,
      influencer_challenges.updated_at,
      COALESCE(ranking.total_points, 0)::int AS my_points,
      ranking.position AS my_position,
      COUNT(influencer_challenge_submissions.id)::bigint AS my_submissions_count
    FROM influencer_challenges
    LEFT JOIN ranking
      ON ranking.challenge_id = influencer_challenges.id
      AND ranking.influencer_id = ${input.influencerId}
    LEFT JOIN influencer_challenge_submissions
      ON influencer_challenge_submissions.company_id = influencer_challenges.company_id
      AND influencer_challenge_submissions.challenge_id = influencer_challenges.id
      AND influencer_challenge_submissions.influencer_id = ${input.influencerId}
    WHERE influencer_challenges.company_id = ${input.companyId}
      AND influencer_challenges.status = 'active'
    GROUP BY influencer_challenges.id, ranking.total_points, ranking.position
    ORDER BY influencer_challenges.starts_at DESC NULLS LAST, influencer_challenges.created_at DESC
  `;
}

export async function createChallengeSubmission(input: {
  companyId: string;
  challengeId: string;
  influencerId: string;
  description: string;
  linkUrl: string | null;
}) {
  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    INSERT INTO influencer_challenge_submissions (
      id,
      company_id,
      challenge_id,
      influencer_id,
      description,
      link_url,
      updated_at
    )
    SELECT
      ${randomUUID()},
      ${input.companyId},
      influencer_challenges.id,
      influencers.id,
      ${input.description},
      ${input.linkUrl},
      now()
    FROM influencer_challenges
    INNER JOIN influencers
      ON influencers.company_id = influencer_challenges.company_id
      AND influencers.id = ${input.influencerId}
    WHERE influencer_challenges.company_id = ${input.companyId}
      AND influencer_challenges.id = ${input.challengeId}
      AND influencer_challenges.status = 'active'
      AND influencers.archived_at IS NULL
    RETURNING id
  `;

  return rows[0] ?? null;
}

export async function listInfluencerChallengeSubmissions(input: {
  companyId: string;
  influencerId: string;
  challengeId?: string | null;
}) {
  return prisma.$queryRaw<ChallengeSubmissionRow[]>`
    SELECT
      influencer_challenge_submissions.id,
      influencer_challenge_submissions.company_id,
      influencer_challenge_submissions.challenge_id,
      influencer_challenge_submissions.influencer_id,
      influencer_challenge_submissions.description,
      influencer_challenge_submissions.link_url,
      influencer_challenge_submissions.file_url,
      influencer_challenge_submissions.status,
      influencer_challenge_submissions.review_note,
      influencer_challenge_submissions.reviewed_at,
      influencer_challenge_submissions.created_at,
      influencer_challenge_submissions.updated_at,
      influencer_challenges.title AS challenge_title,
      influencers.name AS influencer_name,
      influencers.email AS influencer_email
    FROM influencer_challenge_submissions
    INNER JOIN influencer_challenges
      ON influencer_challenges.company_id = influencer_challenge_submissions.company_id
      AND influencer_challenges.id = influencer_challenge_submissions.challenge_id
    INNER JOIN influencers
      ON influencers.company_id = influencer_challenge_submissions.company_id
      AND influencers.id = influencer_challenge_submissions.influencer_id
    WHERE influencer_challenge_submissions.company_id = ${input.companyId}
      AND influencer_challenge_submissions.influencer_id = ${input.influencerId}
      AND (${input.challengeId ?? null}::text IS NULL OR influencer_challenge_submissions.challenge_id = ${input.challengeId ?? null})
    ORDER BY influencer_challenge_submissions.created_at DESC
  `;
}

export async function listCompanyChallengeSubmissions(input: {
  companyId: string;
  status?: InfluencerChallengeSubmissionStatus | null;
}) {
  return prisma.$queryRaw<ChallengeSubmissionRow[]>`
    SELECT
      influencer_challenge_submissions.id,
      influencer_challenge_submissions.company_id,
      influencer_challenge_submissions.challenge_id,
      influencer_challenge_submissions.influencer_id,
      influencer_challenge_submissions.description,
      influencer_challenge_submissions.link_url,
      influencer_challenge_submissions.file_url,
      influencer_challenge_submissions.status,
      influencer_challenge_submissions.review_note,
      influencer_challenge_submissions.reviewed_at,
      influencer_challenge_submissions.created_at,
      influencer_challenge_submissions.updated_at,
      influencer_challenges.title AS challenge_title,
      influencers.name AS influencer_name,
      influencers.email AS influencer_email
    FROM influencer_challenge_submissions
    INNER JOIN influencer_challenges
      ON influencer_challenges.company_id = influencer_challenge_submissions.company_id
      AND influencer_challenges.id = influencer_challenge_submissions.challenge_id
    INNER JOIN influencers
      ON influencers.company_id = influencer_challenge_submissions.company_id
      AND influencers.id = influencer_challenge_submissions.influencer_id
    WHERE influencer_challenge_submissions.company_id = ${input.companyId}
      AND (${input.status ?? null}::"InfluencerChallengeSubmissionStatus" IS NULL OR influencer_challenge_submissions.status = ${input.status ?? null}::"InfluencerChallengeSubmissionStatus")
    ORDER BY influencer_challenge_submissions.created_at DESC
  `;
}

export async function reviewChallengeSubmission(input: {
  companyId: string;
  submissionId: string;
  status: Exclude<InfluencerChallengeSubmissionStatus, "pending">;
  reviewNote: string | null;
}) {
  const rows = await prisma.$queryRaw<ChallengeSubmissionRow[]>`
    UPDATE influencer_challenge_submissions
    SET
      status = ${input.status}::"InfluencerChallengeSubmissionStatus",
      review_note = ${input.reviewNote},
      reviewed_at = now(),
      updated_at = now()
    FROM influencer_challenges, influencers
    WHERE influencer_challenge_submissions.company_id = ${input.companyId}
      AND influencer_challenge_submissions.id = ${input.submissionId}
      AND influencer_challenges.company_id = influencer_challenge_submissions.company_id
      AND influencer_challenges.id = influencer_challenge_submissions.challenge_id
      AND influencers.company_id = influencer_challenge_submissions.company_id
      AND influencers.id = influencer_challenge_submissions.influencer_id
    RETURNING
      influencer_challenge_submissions.id,
      influencer_challenge_submissions.company_id,
      influencer_challenge_submissions.challenge_id,
      influencer_challenge_submissions.influencer_id,
      influencer_challenge_submissions.description,
      influencer_challenge_submissions.link_url,
      influencer_challenge_submissions.file_url,
      influencer_challenge_submissions.status,
      influencer_challenge_submissions.review_note,
      influencer_challenge_submissions.reviewed_at,
      influencer_challenge_submissions.created_at,
      influencer_challenge_submissions.updated_at,
      influencer_challenges.title AS challenge_title,
      influencers.name AS influencer_name,
      influencers.email AS influencer_email
  `;

  return rows[0] ?? null;
}

export async function createChallengeScore(input: {
  companyId: string;
  challengeId: string;
  influencerId: string;
  submissionId?: string | null;
  points: number;
  note: string | null;
}) {
  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    INSERT INTO influencer_challenge_scores (
      id,
      company_id,
      challenge_id,
      influencer_id,
      submission_id,
      points,
      note,
      updated_at
    )
    SELECT
      ${randomUUID()},
      ${input.companyId},
      influencer_challenges.id,
      influencers.id,
      ${input.submissionId ?? null},
      ${input.points},
      ${input.note},
      now()
    FROM influencer_challenges
    INNER JOIN influencers
      ON influencers.company_id = influencer_challenges.company_id
      AND influencers.id = ${input.influencerId}
    WHERE influencer_challenges.company_id = ${input.companyId}
      AND influencer_challenges.id = ${input.challengeId}
    RETURNING id
  `;

  return rows[0] ?? null;
}

export async function listChallengeRanking(input: {
  companyId: string;
  challengeId: string;
}) {
  return prisma.$queryRaw<ChallengeRankingRow[]>`
    WITH ranking AS (
      SELECT
        influencer_challenge_scores.influencer_id,
        SUM(influencer_challenge_scores.points)::int AS total_points,
        RANK() OVER (ORDER BY SUM(influencer_challenge_scores.points) DESC) AS position
      FROM influencer_challenge_scores
      WHERE influencer_challenge_scores.company_id = ${input.companyId}
        AND influencer_challenge_scores.challenge_id = ${input.challengeId}
      GROUP BY influencer_challenge_scores.influencer_id
    )
    SELECT
      ranking.influencer_id,
      influencers.name AS influencer_name,
      influencers.coupon_code AS influencer_coupon_code,
      ranking.total_points,
      ranking.position
    FROM ranking
    INNER JOIN influencers
      ON influencers.company_id = ${input.companyId}
      AND influencers.id = ranking.influencer_id
    ORDER BY ranking.position ASC, influencers.name ASC
  `;
}

export async function listInfluencerChallengeParticipation(input: {
  companyId: string;
  influencerId: string;
}) {
  return prisma.$queryRaw<InfluencerChallengeParticipationRow[]>`
    WITH ranking AS (
      SELECT
        challenge_id,
        influencer_id,
        SUM(points)::int AS total_points,
        RANK() OVER (
          PARTITION BY challenge_id
          ORDER BY SUM(points) DESC
        ) AS position
      FROM influencer_challenge_scores
      WHERE company_id = ${input.companyId}
      GROUP BY challenge_id, influencer_id
    )
    SELECT
      influencer_challenges.id,
      influencer_challenges.company_id,
      influencer_challenges.title,
      influencer_challenges.description,
      influencer_challenges.prize_description,
      influencer_challenges.status,
      influencer_challenges.starts_at,
      influencer_challenges.ends_at,
      influencer_challenges.created_at,
      influencer_challenges.updated_at,
      COALESCE(ranking.total_points, 0)::int AS my_points,
      ranking.position AS my_position,
      COUNT(influencer_challenge_submissions.id)::bigint AS my_submissions_count,
      latest_submission.status AS latest_submission_status,
      latest_submission.link_url AS latest_submission_link_url,
      latest_submission.created_at AS latest_submission_created_at
    FROM influencer_challenges
    LEFT JOIN ranking
      ON ranking.challenge_id = influencer_challenges.id
      AND ranking.influencer_id = ${input.influencerId}
    LEFT JOIN influencer_challenge_submissions
      ON influencer_challenge_submissions.company_id = influencer_challenges.company_id
      AND influencer_challenge_submissions.challenge_id = influencer_challenges.id
      AND influencer_challenge_submissions.influencer_id = ${input.influencerId}
    LEFT JOIN LATERAL (
      SELECT status, link_url, created_at
      FROM influencer_challenge_submissions latest
      WHERE latest.company_id = influencer_challenges.company_id
        AND latest.challenge_id = influencer_challenges.id
        AND latest.influencer_id = ${input.influencerId}
      ORDER BY latest.created_at DESC
      LIMIT 1
    ) latest_submission ON true
    WHERE influencer_challenges.company_id = ${input.companyId}
      AND (
        ranking.influencer_id IS NOT NULL
        OR influencer_challenge_submissions.id IS NOT NULL
        OR influencer_challenges.status = 'active'
      )
    GROUP BY influencer_challenges.id, ranking.total_points, ranking.position, latest_submission.status, latest_submission.link_url, latest_submission.created_at
    ORDER BY influencer_challenges.created_at DESC
  `;
}
