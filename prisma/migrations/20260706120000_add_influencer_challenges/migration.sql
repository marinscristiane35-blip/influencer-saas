CREATE TYPE "InfluencerChallengeStatus" AS ENUM ('draft', 'active', 'finished', 'cancelled');

CREATE TYPE "InfluencerChallengeSubmissionStatus" AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE "influencer_challenges" (
  "id" TEXT NOT NULL,
  "company_id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "prize_description" TEXT,
  "status" "InfluencerChallengeStatus" NOT NULL DEFAULT 'draft',
  "starts_at" TIMESTAMP(3),
  "ends_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "influencer_challenges_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "influencer_challenge_submissions" (
  "id" TEXT NOT NULL,
  "company_id" TEXT NOT NULL,
  "challenge_id" TEXT NOT NULL,
  "influencer_id" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "link_url" TEXT,
  "file_url" TEXT,
  "status" "InfluencerChallengeSubmissionStatus" NOT NULL DEFAULT 'pending',
  "review_note" TEXT,
  "reviewed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "influencer_challenge_submissions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "influencer_challenge_scores" (
  "id" TEXT NOT NULL,
  "company_id" TEXT NOT NULL,
  "challenge_id" TEXT NOT NULL,
  "influencer_id" TEXT NOT NULL,
  "submission_id" TEXT,
  "points" INTEGER NOT NULL,
  "note" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "influencer_challenge_scores_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "influencer_challenges_company_id_status_idx" ON "influencer_challenges"("company_id", "status");
CREATE INDEX "influencer_challenges_company_id_starts_at_idx" ON "influencer_challenges"("company_id", "starts_at");
CREATE INDEX "influencer_challenges_company_id_created_at_idx" ON "influencer_challenges"("company_id", "created_at");

CREATE INDEX "influencer_challenge_submissions_company_id_challenge_id_idx" ON "influencer_challenge_submissions"("company_id", "challenge_id");
CREATE INDEX "influencer_challenge_submissions_company_id_influencer_id_idx" ON "influencer_challenge_submissions"("company_id", "influencer_id");
CREATE INDEX "influencer_challenge_submissions_company_id_status_idx" ON "influencer_challenge_submissions"("company_id", "status");
CREATE INDEX "influencer_challenge_submissions_company_id_created_at_idx" ON "influencer_challenge_submissions"("company_id", "created_at");

CREATE INDEX "influencer_challenge_scores_company_id_challenge_id_idx" ON "influencer_challenge_scores"("company_id", "challenge_id");
CREATE INDEX "influencer_challenge_scores_company_id_influencer_id_idx" ON "influencer_challenge_scores"("company_id", "influencer_id");
CREATE INDEX "influencer_challenge_scores_company_id_submission_id_idx" ON "influencer_challenge_scores"("company_id", "submission_id");

ALTER TABLE "influencer_challenges"
  ADD CONSTRAINT "influencer_challenges_company_id_fkey"
  FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "influencer_challenge_submissions"
  ADD CONSTRAINT "influencer_challenge_submissions_company_id_fkey"
  FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "influencer_challenge_submissions"
  ADD CONSTRAINT "influencer_challenge_submissions_challenge_id_fkey"
  FOREIGN KEY ("challenge_id") REFERENCES "influencer_challenges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "influencer_challenge_submissions"
  ADD CONSTRAINT "influencer_challenge_submissions_influencer_id_fkey"
  FOREIGN KEY ("influencer_id") REFERENCES "influencers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "influencer_challenge_scores"
  ADD CONSTRAINT "influencer_challenge_scores_company_id_fkey"
  FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "influencer_challenge_scores"
  ADD CONSTRAINT "influencer_challenge_scores_challenge_id_fkey"
  FOREIGN KEY ("challenge_id") REFERENCES "influencer_challenges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "influencer_challenge_scores"
  ADD CONSTRAINT "influencer_challenge_scores_influencer_id_fkey"
  FOREIGN KEY ("influencer_id") REFERENCES "influencers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "influencer_challenge_scores"
  ADD CONSTRAINT "influencer_challenge_scores_submission_id_fkey"
  FOREIGN KEY ("submission_id") REFERENCES "influencer_challenge_submissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
