-- CreateEnum
CREATE TYPE "InfluencerStatus" AS ENUM ('active', 'invited', 'paused', 'declined');

-- CreateTable
CREATE TABLE "influencers" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "instagram" TEXT,
    "status" "InfluencerStatus" NOT NULL DEFAULT 'invited',
    "coupon_code" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "influencers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "influencers_company_id_email_key" ON "influencers"("company_id", "email");

-- CreateIndex
CREATE UNIQUE INDEX "influencers_company_id_instagram_key" ON "influencers"("company_id", "instagram");

-- CreateIndex
CREATE UNIQUE INDEX "influencers_company_id_coupon_code_key" ON "influencers"("company_id", "coupon_code");

-- CreateIndex
CREATE INDEX "influencers_company_id_status_idx" ON "influencers"("company_id", "status");

-- CreateIndex
CREATE INDEX "influencers_company_id_created_at_idx" ON "influencers"("company_id", "created_at");

-- AddForeignKey
ALTER TABLE "influencers" ADD CONSTRAINT "influencers_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
