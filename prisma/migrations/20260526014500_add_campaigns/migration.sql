-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('draft', 'active', 'paused', 'finished');

-- CreateTable
CREATE TABLE "campaigns" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "objective" TEXT,
    "status" "CampaignStatus" NOT NULL DEFAULT 'draft',
    "starts_at" TIMESTAMP(3),
    "ends_at" TIMESTAMP(3),
    "planned_budget" DECIMAL(12,2),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "campaigns_company_id_status_idx" ON "campaigns"("company_id", "status");

-- CreateIndex
CREATE INDEX "campaigns_company_id_starts_at_idx" ON "campaigns"("company_id", "starts_at");

-- CreateIndex
CREATE INDEX "campaigns_company_id_created_at_idx" ON "campaigns"("company_id", "created_at");

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
