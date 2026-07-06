ALTER TABLE "influencers" ADD COLUMN IF NOT EXISTS "archived_at" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "influencers_company_id_archived_at_idx" ON "influencers"("company_id", "archived_at");
