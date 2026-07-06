DO $$ BEGIN
    CREATE TYPE "InfluencerPortalAccountStatus" AS ENUM ('active', 'inactive');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "CampaignInfluencerStatus" AS ENUM ('invited', 'active', 'paused', 'finished');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "influencer_portal_accounts" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "influencer_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "status" "InfluencerPortalAccountStatus" NOT NULL DEFAULT 'active',
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "influencer_portal_accounts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "campaign_influencers" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "influencer_id" TEXT NOT NULL,
    "status" "CampaignInfluencerStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_influencers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "influencer_portal_accounts_influencer_id_key" ON "influencer_portal_accounts"("influencer_id");
CREATE UNIQUE INDEX IF NOT EXISTS "influencer_portal_accounts_company_id_email_key" ON "influencer_portal_accounts"("company_id", "email");
CREATE UNIQUE INDEX IF NOT EXISTS "influencer_portal_accounts_company_id_influencer_id_key" ON "influencer_portal_accounts"("company_id", "influencer_id");
CREATE INDEX IF NOT EXISTS "influencer_portal_accounts_company_id_status_idx" ON "influencer_portal_accounts"("company_id", "status");

CREATE UNIQUE INDEX IF NOT EXISTS "campaign_influencers_company_id_campaign_id_influencer_id_key" ON "campaign_influencers"("company_id", "campaign_id", "influencer_id");
CREATE INDEX IF NOT EXISTS "campaign_influencers_company_id_campaign_id_idx" ON "campaign_influencers"("company_id", "campaign_id");
CREATE INDEX IF NOT EXISTS "campaign_influencers_company_id_influencer_id_idx" ON "campaign_influencers"("company_id", "influencer_id");
CREATE INDEX IF NOT EXISTS "campaign_influencers_company_id_status_idx" ON "campaign_influencers"("company_id", "status");

DO $$ BEGIN
    ALTER TABLE "influencer_portal_accounts" ADD CONSTRAINT "influencer_portal_accounts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "influencer_portal_accounts" ADD CONSTRAINT "influencer_portal_accounts_influencer_id_fkey" FOREIGN KEY ("influencer_id") REFERENCES "influencers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "campaign_influencers" ADD CONSTRAINT "campaign_influencers_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "campaign_influencers" ADD CONSTRAINT "campaign_influencers_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "campaign_influencers" ADD CONSTRAINT "campaign_influencers_influencer_id_fkey" FOREIGN KEY ("influencer_id") REFERENCES "influencers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
