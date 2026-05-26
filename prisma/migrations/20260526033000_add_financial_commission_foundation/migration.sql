DO $$ BEGIN
    CREATE TYPE "BalanceReleaseMode" AS ENUM ('immediate', 'monthly');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "InfluencerCouponStatus" AS ENUM ('active', 'inactive');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "CommissionEventStatus" AS ENUM ('pending', 'approved', 'blocked', 'available', 'cancelled', 'reversed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "CommissionSourceType" AS ENUM ('order', 'spreadsheet', 'manual', 'challenge');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "wallet_transactions" ADD COLUMN IF NOT EXISTS "commission_event_id" TEXT;

CREATE TABLE IF NOT EXISTS "company_financial_settings" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "release_mode" "BalanceReleaseMode" NOT NULL DEFAULT 'immediate',
    "monthly_release_day" INTEGER,
    "default_commission_rate" DECIMAL(5,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_financial_settings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "influencer_coupons" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "influencer_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" "InfluencerCouponStatus" NOT NULL DEFAULT 'active',
    "starts_at" TIMESTAMP(3),
    "ends_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "influencer_coupons_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "commission_events" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "influencer_id" TEXT NOT NULL,
    "coupon_id" TEXT,
    "source_type" "CommissionSourceType" NOT NULL,
    "source_id" TEXT,
    "status" "CommissionEventStatus" NOT NULL DEFAULT 'pending',
    "base_amount" DECIMAL(12,2) NOT NULL,
    "commission_rate" DECIMAL(5,2),
    "amount" DECIMAL(12,2) NOT NULL,
    "competence_month" INTEGER NOT NULL,
    "competence_year" INTEGER NOT NULL,
    "available_at" TIMESTAMP(3),
    "description" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commission_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "company_financial_settings_company_id_key" ON "company_financial_settings"("company_id");
CREATE UNIQUE INDEX IF NOT EXISTS "influencer_coupons_company_id_code_key" ON "influencer_coupons"("company_id", "code");
CREATE INDEX IF NOT EXISTS "influencer_coupons_company_id_influencer_id_idx" ON "influencer_coupons"("company_id", "influencer_id");
CREATE INDEX IF NOT EXISTS "influencer_coupons_company_id_status_idx" ON "influencer_coupons"("company_id", "status");
CREATE UNIQUE INDEX IF NOT EXISTS "commission_events_company_id_source_type_source_id_key" ON "commission_events"("company_id", "source_type", "source_id");
CREATE INDEX IF NOT EXISTS "commission_events_company_id_influencer_id_competence_year_competence_month_idx" ON "commission_events"("company_id", "influencer_id", "competence_year", "competence_month");
CREATE INDEX IF NOT EXISTS "commission_events_company_id_status_idx" ON "commission_events"("company_id", "status");
CREATE INDEX IF NOT EXISTS "commission_events_company_id_coupon_id_idx" ON "commission_events"("company_id", "coupon_id");
CREATE INDEX IF NOT EXISTS "wallet_transactions_commission_event_id_idx" ON "wallet_transactions"("commission_event_id");

DO $$ BEGIN
    ALTER TABLE "company_financial_settings" ADD CONSTRAINT "company_financial_settings_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "influencer_coupons" ADD CONSTRAINT "influencer_coupons_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "influencer_coupons" ADD CONSTRAINT "influencer_coupons_influencer_id_fkey" FOREIGN KEY ("influencer_id") REFERENCES "influencers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "commission_events" ADD CONSTRAINT "commission_events_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "commission_events" ADD CONSTRAINT "commission_events_influencer_id_fkey" FOREIGN KEY ("influencer_id") REFERENCES "influencers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "commission_events" ADD CONSTRAINT "commission_events_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "influencer_coupons"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_commission_event_id_fkey" FOREIGN KEY ("commission_event_id") REFERENCES "commission_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
