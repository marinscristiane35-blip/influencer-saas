DO $$ BEGIN
    CREATE TYPE "ImportedOrderStatus" AS ENUM ('pending', 'paid', 'cancelled', 'refunded');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "OrderImportSource" AS ENUM ('spreadsheet');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "imported_orders" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "external_id" TEXT NOT NULL,
    "customer_email" TEXT,
    "coupon_code" TEXT,
    "gross_amount" DECIMAL(12,2) NOT NULL,
    "status" "ImportedOrderStatus" NOT NULL,
    "source" "OrderImportSource" NOT NULL DEFAULT 'spreadsheet',
    "ordered_at" TIMESTAMP(3) NOT NULL,
    "raw_payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "imported_orders_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "imported_orders_company_id_source_external_id_key" ON "imported_orders"("company_id", "source", "external_id");
CREATE INDEX IF NOT EXISTS "imported_orders_company_id_coupon_code_idx" ON "imported_orders"("company_id", "coupon_code");
CREATE INDEX IF NOT EXISTS "imported_orders_company_id_ordered_at_idx" ON "imported_orders"("company_id", "ordered_at");
CREATE INDEX IF NOT EXISTS "imported_orders_company_id_status_idx" ON "imported_orders"("company_id", "status");

DO $$ BEGIN
    ALTER TABLE "imported_orders" ADD CONSTRAINT "imported_orders_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "company_financial_settings" ALTER COLUMN "default_commission_rate" SET DEFAULT 10.00;
UPDATE "company_financial_settings"
SET "default_commission_rate" = 10.00
WHERE "default_commission_rate" IS NULL;

INSERT INTO influencer_coupons (
    id,
    company_id,
    influencer_id,
    code,
    status,
    updated_at
)
SELECT
    'coupon_' || md5(random()::text || clock_timestamp()::text || id),
    company_id,
    id,
    coupon_code,
    'active'::"InfluencerCouponStatus",
    now()
FROM influencers
WHERE coupon_code IS NOT NULL
ON CONFLICT (company_id, code) DO NOTHING;
