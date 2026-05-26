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
  commission_status: string;
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
