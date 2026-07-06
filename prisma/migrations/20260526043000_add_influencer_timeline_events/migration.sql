CREATE TABLE IF NOT EXISTS "influencer_timeline_events" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "influencer_id" TEXT NOT NULL,
    "user_id" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "influencer_timeline_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "influencer_timeline_events_company_id_influencer_id_created_at_idx" ON "influencer_timeline_events"("company_id", "influencer_id", "created_at");
CREATE INDEX IF NOT EXISTS "influencer_timeline_events_company_id_type_idx" ON "influencer_timeline_events"("company_id", "type");

DO $$ BEGIN
    ALTER TABLE "influencer_timeline_events" ADD CONSTRAINT "influencer_timeline_events_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "influencer_timeline_events" ADD CONSTRAINT "influencer_timeline_events_influencer_id_fkey" FOREIGN KEY ("influencer_id") REFERENCES "influencers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "influencer_timeline_events" ADD CONSTRAINT "influencer_timeline_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
