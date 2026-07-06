import "server-only";

import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/database/prisma";

export type ImportedOrderStatus = "pending" | "paid" | "cancelled" | "refunded";
export type OrderImportSource = "spreadsheet";

export type ImportedOrderRow = {
  id: string;
  company_id: string;
  external_id: string;
  customer_email: string | null;
  coupon_code: string | null;
  gross_amount: string;
  status: ImportedOrderStatus;
  source: OrderImportSource;
  ordered_at: Date;
  raw_payload: unknown | null;
  created_at: Date;
  updated_at: Date;
};

export type CompanyImportSummaryRow = {
  total_imported: bigint;
  matched_orders: bigint;
  unmatched_orders: bigint;
  generated_commission: string | null;
};

export type InfluencerCommissionOrderRow = {
  order_id: string;
  external_id: string;
  customer_email: string | null;
  coupon_code: string | null;
  gross_amount: string;
  ordered_at: Date;
  commission_id: string;
  commission_amount: string;
  commission_rate: string | null;
  commission_status: string;
};

export type CommissionDetailRow = InfluencerCommissionOrderRow & {
  commission_base_amount: string;
  commission_source_type: string;
  commission_created_at: Date;
  commission_available_at: Date | null;
};

export type InfluencerCouponOrderRow = {
  order_id: string;
  external_id: string;
  customer_email: string | null;
  coupon_code: string | null;
  gross_amount: string;
  status: ImportedOrderStatus;
  source: OrderImportSource;
  ordered_at: Date;
  commission_id: string | null;
  commission_amount: string | null;
  commission_rate: string | null;
  commission_status: string | null;
};

export type InfluencerMonthlySummaryRow = {
  month_start: Date;
  orders_count: bigint;
  gross_amount: string;
  commission_amount: string;
};

export type InfluencerRankingPositionRow = {
  influencer_id: string;
  position: bigint;
  gross_amount: string;
  orders_count: bigint;
};

export async function createImportedOrder(input: {
  companyId: string;
  externalId: string;
  customerEmail: string | null;
  couponCode: string | null;
  grossAmount: string;
  status: ImportedOrderStatus;
  orderedAt: Date;
  rawPayload: Record<string, string | null>;
}) {
  const rawPayload = JSON.stringify(input.rawPayload);
  const rows = await prisma.$queryRaw<ImportedOrderRow[]>`
    INSERT INTO imported_orders (
      id,
      company_id,
      external_id,
      customer_email,
      coupon_code,
      gross_amount,
      status,
      source,
      ordered_at,
      raw_payload,
      updated_at
    )
    VALUES (
      ${randomUUID()},
      ${input.companyId},
      ${input.externalId},
      ${input.customerEmail},
      ${input.couponCode},
      ${input.grossAmount}::decimal,
      ${input.status}::"ImportedOrderStatus",
      'spreadsheet'::"OrderImportSource",
      ${input.orderedAt},
      ${rawPayload}::jsonb,
      now()
    )
    ON CONFLICT (company_id, source, external_id) DO NOTHING
    RETURNING
      id,
      company_id,
      external_id,
      customer_email,
      coupon_code,
      gross_amount::text,
      status,
      source,
      ordered_at,
      raw_payload,
      created_at,
      updated_at
  `;

  return rows[0] ?? null;
}

export async function getCompanyImportSummary(companyId: string) {
  const rows = await prisma.$queryRaw<CompanyImportSummaryRow[]>`
    SELECT
      COUNT(imported_orders.id)::bigint AS total_imported,
      COUNT(commission_events.id)::bigint AS matched_orders,
      (
        COUNT(imported_orders.id) - COUNT(commission_events.id)
      )::bigint AS unmatched_orders,
      COALESCE(SUM(commission_events.amount), 0)::text AS generated_commission
    FROM imported_orders
    LEFT JOIN commission_events
      ON commission_events.company_id = imported_orders.company_id
      AND commission_events.source_type = 'spreadsheet'
      AND commission_events.source_id = imported_orders.external_id
    WHERE imported_orders.company_id = ${companyId}
  `;

  return (
    rows[0] ?? {
      generated_commission: "0",
      matched_orders: BigInt(0),
      total_imported: BigInt(0),
      unmatched_orders: BigInt(0),
    }
  );
}

export async function listRecentInfluencerCommissionOrders(input: {
  companyId: string;
  influencerId: string;
  limit?: number;
}) {
  const limit = Math.min(Math.max(input.limit ?? 10, 1), 50);

  return prisma.$queryRaw<InfluencerCommissionOrderRow[]>`
    SELECT
      imported_orders.id AS order_id,
      imported_orders.external_id,
      imported_orders.customer_email,
      imported_orders.coupon_code,
      imported_orders.gross_amount::text,
      imported_orders.ordered_at,
      commission_events.id AS commission_id,
      commission_events.amount::text AS commission_amount,
      commission_events.commission_rate::text AS commission_rate,
      commission_events.status::text AS commission_status
    FROM commission_events
    INNER JOIN imported_orders
      ON imported_orders.company_id = commission_events.company_id
      AND imported_orders.external_id = commission_events.source_id
      AND imported_orders.source = 'spreadsheet'
    WHERE commission_events.company_id = ${input.companyId}
      AND commission_events.influencer_id = ${input.influencerId}
      AND commission_events.source_type = 'spreadsheet'
    ORDER BY imported_orders.ordered_at DESC, commission_events.created_at DESC
    LIMIT ${limit}
  `;
}

export async function listRecentInfluencerCommissions(input: {
  companyId: string;
  influencerId: string;
  limit?: number;
}) {
  return listRecentInfluencerCommissionOrders(input);
}

export async function listInfluencerCouponOrders(input: {
  companyId: string;
  influencerId: string;
  limit?: number;
}) {
  const limit = Math.min(Math.max(input.limit ?? 12, 1), 50);

  return prisma.$queryRaw<InfluencerCouponOrderRow[]>`
    WITH influencer_codes AS (
      SELECT UPPER(code) AS code
      FROM influencer_coupons
      WHERE company_id = ${input.companyId}
        AND influencer_id = ${input.influencerId}
      UNION
      SELECT UPPER(coupon_code) AS code
      FROM influencers
      WHERE company_id = ${input.companyId}
        AND id = ${input.influencerId}
        AND coupon_code IS NOT NULL
    )
    SELECT
      imported_orders.id AS order_id,
      imported_orders.external_id,
      imported_orders.customer_email,
      imported_orders.coupon_code,
      imported_orders.gross_amount::text,
      imported_orders.status,
      imported_orders.source,
      imported_orders.ordered_at,
      commission_events.id AS commission_id,
      commission_events.amount::text AS commission_amount,
      commission_events.commission_rate::text AS commission_rate,
      commission_events.status::text AS commission_status
    FROM imported_orders
    INNER JOIN influencer_codes
      ON UPPER(imported_orders.coupon_code) = influencer_codes.code
    LEFT JOIN commission_events
      ON commission_events.company_id = imported_orders.company_id
      AND commission_events.influencer_id = ${input.influencerId}
      AND commission_events.source_type = 'spreadsheet'
      AND commission_events.source_id = imported_orders.external_id
    WHERE imported_orders.company_id = ${input.companyId}
    ORDER BY imported_orders.ordered_at DESC, imported_orders.created_at DESC
    LIMIT ${limit}
  `;
}

export async function listInfluencerMonthlySummaries(input: {
  companyId: string;
  influencerId: string;
  months?: number;
}) {
  const months = Math.min(Math.max(input.months ?? 6, 1), 12);

  return prisma.$queryRaw<InfluencerMonthlySummaryRow[]>`
    WITH influencer_codes AS (
      SELECT UPPER(code) AS code
      FROM influencer_coupons
      WHERE company_id = ${input.companyId}
        AND influencer_id = ${input.influencerId}
      UNION
      SELECT UPPER(coupon_code) AS code
      FROM influencers
      WHERE company_id = ${input.companyId}
        AND id = ${input.influencerId}
        AND coupon_code IS NOT NULL
    ),
    months AS (
      SELECT generate_series(
        date_trunc('month', now()) - (${months - 1} * interval '1 month'),
        date_trunc('month', now()),
        interval '1 month'
      )::date AS month_start
    ),
    order_summary AS (
      SELECT
        date_trunc('month', imported_orders.ordered_at)::date AS month_start,
        COUNT(imported_orders.id)::bigint AS orders_count,
        COALESCE(SUM(imported_orders.gross_amount), 0)::text AS gross_amount
      FROM imported_orders
      INNER JOIN influencer_codes
        ON UPPER(imported_orders.coupon_code) = influencer_codes.code
      WHERE imported_orders.company_id = ${input.companyId}
        AND imported_orders.status = 'paid'
        AND imported_orders.ordered_at >= date_trunc('month', now()) - (${months - 1} * interval '1 month')
      GROUP BY 1
    ),
    commission_summary AS (
      SELECT
        make_date(commission_events.competence_year, commission_events.competence_month, 1) AS month_start,
        COALESCE(SUM(commission_events.amount), 0)::text AS commission_amount
      FROM commission_events
      WHERE commission_events.company_id = ${input.companyId}
        AND commission_events.influencer_id = ${input.influencerId}
        AND commission_events.status IN ('approved', 'blocked', 'available')
        AND make_date(commission_events.competence_year, commission_events.competence_month, 1) >= date_trunc('month', now()) - (${months - 1} * interval '1 month')
      GROUP BY 1
    )
    SELECT
      months.month_start,
      COALESCE(order_summary.orders_count, 0)::bigint AS orders_count,
      COALESCE(order_summary.gross_amount, '0') AS gross_amount,
      COALESCE(commission_summary.commission_amount, '0') AS commission_amount
    FROM months
    LEFT JOIN order_summary ON order_summary.month_start = months.month_start
    LEFT JOIN commission_summary ON commission_summary.month_start = months.month_start
    ORDER BY months.month_start DESC
  `;
}

export async function getInfluencerMonthlyRankingPosition(input: {
  companyId: string;
  influencerId: string;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const rows = await prisma.$queryRaw<InfluencerRankingPositionRow[]>`
    WITH influencer_codes AS (
      SELECT
        influencers.id AS influencer_id,
        UPPER(influencer_coupons.code) AS code
      FROM influencers
      INNER JOIN influencer_coupons
        ON influencer_coupons.company_id = influencers.company_id
        AND influencer_coupons.influencer_id = influencers.id
      WHERE influencers.company_id = ${input.companyId}
        AND influencers.archived_at IS NULL
      UNION
      SELECT
        influencers.id AS influencer_id,
        UPPER(influencers.coupon_code) AS code
      FROM influencers
      WHERE influencers.company_id = ${input.companyId}
        AND influencers.archived_at IS NULL
        AND influencers.coupon_code IS NOT NULL
    ),
    ranking_base AS (
      SELECT
        influencer_codes.influencer_id,
        COUNT(imported_orders.id)::bigint AS orders_count,
        COALESCE(SUM(imported_orders.gross_amount), 0) AS gross_amount
      FROM influencer_codes
      INNER JOIN imported_orders
        ON imported_orders.company_id = ${input.companyId}
        AND UPPER(imported_orders.coupon_code) = influencer_codes.code
        AND imported_orders.status = 'paid'
        AND EXTRACT(MONTH FROM imported_orders.ordered_at) = ${month}
        AND EXTRACT(YEAR FROM imported_orders.ordered_at) = ${year}
      GROUP BY influencer_codes.influencer_id
    ),
    ranked AS (
      SELECT
        ranking_base.influencer_id,
        RANK() OVER (ORDER BY ranking_base.gross_amount DESC) AS position,
        ranking_base.gross_amount::text,
        ranking_base.orders_count
      FROM ranking_base
    )
    SELECT *
    FROM ranked
    WHERE influencer_id = ${input.influencerId}
    LIMIT 1
  `;

  return rows[0] ?? null;
}

export async function findInfluencerCommissionDetail(input: {
  companyId: string;
  influencerId: string;
  commissionId: string;
}) {
  const rows = await prisma.$queryRaw<CommissionDetailRow[]>`
    SELECT
      imported_orders.id AS order_id,
      imported_orders.external_id,
      imported_orders.customer_email,
      imported_orders.coupon_code,
      imported_orders.gross_amount::text,
      imported_orders.ordered_at,
      commission_events.id AS commission_id,
      commission_events.amount::text AS commission_amount,
      commission_events.commission_rate::text AS commission_rate,
      commission_events.status::text AS commission_status,
      commission_events.base_amount::text AS commission_base_amount,
      commission_events.source_type::text AS commission_source_type,
      commission_events.created_at AS commission_created_at,
      commission_events.available_at AS commission_available_at
    FROM commission_events
    INNER JOIN imported_orders
      ON imported_orders.company_id = commission_events.company_id
      AND imported_orders.external_id = commission_events.source_id
      AND imported_orders.source = 'spreadsheet'
    WHERE commission_events.company_id = ${input.companyId}
      AND commission_events.influencer_id = ${input.influencerId}
      AND commission_events.id = ${input.commissionId}
      AND commission_events.source_type = 'spreadsheet'
    LIMIT 1
  `;

  return rows[0] ?? null;
}

export async function sumCurrentMonthInfluencerCommissions(input: {
  companyId: string;
  influencerId: string;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const rows = await prisma.$queryRaw<Array<{ total: string }>>`
    SELECT COALESCE(SUM(amount), 0)::text AS total
    FROM commission_events
    WHERE company_id = ${input.companyId}
      AND influencer_id = ${input.influencerId}
      AND competence_month = ${month}
      AND competence_year = ${year}
      AND status IN ('approved', 'blocked', 'available')
  `;

  return rows[0]?.total ?? "0";
}

export async function sumInfluencerTotalCommissions(input: {
  companyId: string;
  influencerId: string;
}) {
  const rows = await prisma.$queryRaw<Array<{ total: string }>>`
    SELECT COALESCE(SUM(amount), 0)::text AS total
    FROM commission_events
    WHERE company_id = ${input.companyId}
      AND influencer_id = ${input.influencerId}
      AND status IN ('approved', 'blocked', 'available')
  `;

  return rows[0]?.total ?? "0";
}
