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
  archived_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

export type InfluencerOperationalSummaryRow = InfluencerRow & {
  available_balance: string | null;
  pending_balance: string | null;
  total_received: string | null;
  current_month_commission: string | null;
  current_month_orders_count: bigint;
  current_month_sold_amount: string | null;
  total_commission: string | null;
  imported_orders_count: bigint;
  last_movement_at: Date | null;
  last_movement_title: string | null;
  portal_account_status: string | null;
  portal_last_login_at: Date | null;
  ranking_position: bigint | null;
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
      archived_at,
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
      archived_at,
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
      null,
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
      influencers.archived_at,
      influencers.created_at,
      influencers.updated_at,
      companies.name AS company_name,
      companies.slug AS company_slug
    FROM influencers
    INNER JOIN companies ON companies.id = influencers.company_id
    WHERE influencers.email = ${email}
      AND influencers.status IN ('active', 'invited')
      AND influencers.archived_at IS NULL
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
      influencers.archived_at,
      influencers.created_at,
      influencers.updated_at,
      companies.name AS company_name,
      companies.slug AS company_slug
    FROM influencers
    INNER JOIN companies ON companies.id = influencers.company_id
    WHERE influencers.id = ${input.influencerId}
      AND influencers.company_id = ${input.companyId}
      AND influencers.status IN ('active', 'invited')
      AND influencers.archived_at IS NULL
    LIMIT 1
  `;

  return rows[0] ?? null;
}

export async function findInfluencerByCompany(input: {
  companyId: string;
  influencerId: string;
}) {
  const rows = await prisma.$queryRaw<InfluencerRow[]>`
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
      archived_at,
      created_at,
      updated_at
    FROM influencers
    WHERE company_id = ${input.companyId}
      AND id = ${input.influencerId}
    LIMIT 1
  `;

  return rows[0] ?? null;
}

export async function findInfluencerDuplicateForUpdate(input: {
  companyId: string;
  influencerId: string;
  email: string;
  instagram: string | null;
  couponCode: string | null;
}) {
  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id
    FROM influencers
    WHERE company_id = ${input.companyId}
      AND id <> ${input.influencerId}
      AND (
        email = ${input.email}
        OR (${input.instagram}::text IS NOT NULL AND instagram = ${input.instagram})
        OR (${input.couponCode}::text IS NOT NULL AND coupon_code = ${input.couponCode})
      )
    LIMIT 1
  `;

  return rows[0] ?? null;
}

export async function updateInfluencer(input: {
  companyId: string;
  influencerId: string;
  name: string;
  email: string;
  phone: string | null;
  instagram: string | null;
  status: InfluencerStatus;
  couponCode: string | null;
  notes: string | null;
}) {
  const rows = await prisma.$queryRaw<InfluencerRow[]>`
    UPDATE influencers
    SET
      name = ${input.name},
      email = ${input.email},
      phone = ${input.phone},
      instagram = ${input.instagram},
      status = ${input.status}::"InfluencerStatus",
      coupon_code = ${input.couponCode},
      notes = ${input.notes},
      updated_at = now()
    WHERE company_id = ${input.companyId}
      AND id = ${input.influencerId}
    RETURNING
      id,
      company_id,
      name,
      email,
      phone,
      instagram,
      status,
      coupon_code,
      notes,
      archived_at,
      created_at,
      updated_at
  `;

  return rows[0] ?? null;
}

export async function updateInfluencerStatus(input: {
  companyId: string;
  influencerId: string;
  status: InfluencerStatus;
}) {
  const rows = await prisma.$queryRaw<InfluencerRow[]>`
    UPDATE influencers
    SET
      status = ${input.status}::"InfluencerStatus",
      updated_at = now()
    WHERE company_id = ${input.companyId}
      AND id = ${input.influencerId}
    RETURNING
      id,
      company_id,
      name,
      email,
      phone,
      instagram,
      status,
      coupon_code,
      notes,
      archived_at,
      created_at,
      updated_at
  `;

  return rows[0] ?? null;
}

export async function archiveInfluencer(input: {
  companyId: string;
  influencerId: string;
}) {
  const rows = await prisma.$queryRaw<InfluencerRow[]>`
    UPDATE influencers
    SET archived_at = COALESCE(archived_at, now()),
        updated_at = now()
    WHERE company_id = ${input.companyId}
      AND id = ${input.influencerId}
    RETURNING
      id,
      company_id,
      name,
      email,
      phone,
      instagram,
      status,
      coupon_code,
      notes,
      archived_at,
      created_at,
      updated_at
  `;

  return rows[0] ?? null;
}

export async function unarchiveInfluencer(input: {
  companyId: string;
  influencerId: string;
}) {
  const rows = await prisma.$queryRaw<InfluencerRow[]>`
    UPDATE influencers
    SET archived_at = NULL,
        updated_at = now()
    WHERE company_id = ${input.companyId}
      AND id = ${input.influencerId}
    RETURNING
      id,
      company_id,
      name,
      email,
      phone,
      instagram,
      status,
      coupon_code,
      notes,
      archived_at,
      created_at,
      updated_at
  `;

  return rows[0] ?? null;
}

export async function listInfluencerOperationalSummaries(input: {
  companyId: string;
  includeArchived?: boolean;
  search?: string | null;
  status?: InfluencerStatus | null;
}) {
  const search = input.search?.trim().toLowerCase();
  const searchPattern = search ? `%${search}%` : null;

  return prisma.$queryRaw<InfluencerOperationalSummaryRow[]>`
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
      influencers.archived_at,
      influencers.created_at,
      influencers.updated_at,
      wallet_accounts.available_balance::text,
      wallet_accounts.pending_balance::text,
      wallet_accounts.total_received::text,
      commission_summary.current_month_commission,
      COALESCE(month_order_summary.current_month_orders_count, 0)::bigint AS current_month_orders_count,
      COALESCE(month_order_summary.current_month_sold_amount, '0') AS current_month_sold_amount,
      commission_summary.total_commission,
      order_summary.imported_orders_count,
      last_movement.last_movement_at,
      last_movement.last_movement_title,
      portal_account.status::text AS portal_account_status,
      portal_account.last_login_at AS portal_last_login_at,
      monthly_ranking.position AS ranking_position
    FROM influencers
    LEFT JOIN wallet_accounts
      ON wallet_accounts.company_id = influencers.company_id
      AND wallet_accounts.influencer_id = influencers.id
    LEFT JOIN influencer_portal_accounts portal_account
      ON portal_account.company_id = influencers.company_id
      AND portal_account.influencer_id = influencers.id
    LEFT JOIN LATERAL (
      SELECT
        COALESCE(SUM(amount) FILTER (
          WHERE competence_month = EXTRACT(MONTH FROM now())::int
            AND competence_year = EXTRACT(YEAR FROM now())::int
            AND status IN ('approved', 'blocked', 'available')
        ), 0)::text AS current_month_commission,
        COALESCE(SUM(amount) FILTER (
          WHERE status IN ('approved', 'blocked', 'available')
        ), 0)::text AS total_commission
      FROM commission_events
      WHERE company_id = influencers.company_id
        AND influencer_id = influencers.id
    ) commission_summary ON true
    LEFT JOIN LATERAL (
      WITH influencer_codes AS (
        SELECT UPPER(code) AS code
        FROM influencer_coupons
        WHERE company_id = influencers.company_id
          AND influencer_id = influencers.id
        UNION
        SELECT UPPER(coupon_code) AS code
        FROM influencers source_influencer
        WHERE source_influencer.company_id = influencers.company_id
          AND source_influencer.id = influencers.id
          AND source_influencer.coupon_code IS NOT NULL
      )
      SELECT
        COUNT(imported_orders.id)::bigint AS current_month_orders_count,
        COALESCE(SUM(imported_orders.gross_amount), 0)::text AS current_month_sold_amount
      FROM imported_orders
      INNER JOIN influencer_codes
        ON UPPER(imported_orders.coupon_code) = influencer_codes.code
      WHERE imported_orders.company_id = influencers.company_id
        AND imported_orders.status = 'paid'
        AND EXTRACT(MONTH FROM imported_orders.ordered_at) = EXTRACT(MONTH FROM now())
        AND EXTRACT(YEAR FROM imported_orders.ordered_at) = EXTRACT(YEAR FROM now())
    ) month_order_summary ON true
    LEFT JOIN LATERAL (
      SELECT COUNT(DISTINCT imported_orders.id)::bigint AS imported_orders_count
      FROM commission_events
      INNER JOIN imported_orders
        ON imported_orders.company_id = commission_events.company_id
        AND imported_orders.external_id = commission_events.source_id
        AND imported_orders.source = 'spreadsheet'
      WHERE commission_events.company_id = influencers.company_id
        AND commission_events.influencer_id = influencers.id
        AND commission_events.source_type = 'spreadsheet'
    ) order_summary ON true
    LEFT JOIN LATERAL (
      SELECT movement_at AS last_movement_at,
             movement_title AS last_movement_title
      FROM (
        SELECT
          created_at AS movement_at,
          title AS movement_title
        FROM influencer_timeline_events
        WHERE company_id = influencers.company_id
          AND influencer_id = influencers.id
        UNION ALL
        SELECT
          occurred_at AS movement_at,
          CONCAT('Extrato: ', type::text) AS movement_title
        FROM wallet_transactions
        WHERE company_id = influencers.company_id
          AND influencer_id = influencers.id
      ) movements
      ORDER BY movement_at DESC
      LIMIT 1
    ) last_movement ON true
    LEFT JOIN LATERAL (
      WITH influencer_codes AS (
        SELECT
          ranked_influencers.id AS influencer_id,
          UPPER(influencer_coupons.code) AS code
        FROM influencers ranked_influencers
        INNER JOIN influencer_coupons
          ON influencer_coupons.company_id = ranked_influencers.company_id
          AND influencer_coupons.influencer_id = ranked_influencers.id
        WHERE ranked_influencers.company_id = influencers.company_id
          AND ranked_influencers.archived_at IS NULL
        UNION
        SELECT
          ranked_influencers.id AS influencer_id,
          UPPER(ranked_influencers.coupon_code) AS code
        FROM influencers ranked_influencers
        WHERE ranked_influencers.company_id = influencers.company_id
          AND ranked_influencers.archived_at IS NULL
          AND ranked_influencers.coupon_code IS NOT NULL
      ),
      ranking_base AS (
        SELECT
          influencer_codes.influencer_id,
          COALESCE(SUM(imported_orders.gross_amount), 0) AS sold_amount
        FROM influencer_codes
        INNER JOIN imported_orders
          ON imported_orders.company_id = influencers.company_id
          AND UPPER(imported_orders.coupon_code) = influencer_codes.code
          AND imported_orders.status = 'paid'
          AND EXTRACT(MONTH FROM imported_orders.ordered_at) = EXTRACT(MONTH FROM now())
          AND EXTRACT(YEAR FROM imported_orders.ordered_at) = EXTRACT(YEAR FROM now())
        GROUP BY influencer_codes.influencer_id
      ),
      ranked AS (
        SELECT
          influencer_id,
          RANK() OVER (ORDER BY sold_amount DESC) AS position
        FROM ranking_base
      )
      SELECT position
      FROM ranked
      WHERE influencer_id = influencers.id
      LIMIT 1
    ) monthly_ranking ON true
    WHERE influencers.company_id = ${input.companyId}
      AND (${input.includeArchived ?? false}::boolean OR influencers.archived_at IS NULL)
      AND (${input.status ?? null}::"InfluencerStatus" IS NULL OR influencers.status = ${input.status ?? null}::"InfluencerStatus")
      AND (
        ${searchPattern}::text IS NULL
        OR lower(influencers.name) LIKE ${searchPattern}
        OR lower(influencers.email) LIKE ${searchPattern}
        OR lower(COALESCE(influencers.coupon_code, '')) LIKE ${searchPattern}
      )
    ORDER BY
      influencers.archived_at ASC NULLS FIRST,
      COALESCE(last_movement.last_movement_at, influencers.updated_at, influencers.created_at) DESC
  `;
}
