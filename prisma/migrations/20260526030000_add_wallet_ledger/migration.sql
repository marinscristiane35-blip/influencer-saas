-- CreateEnum
CREATE TYPE "WalletTransactionType" AS ENUM ('commission', 'bonus', 'adjustment', 'payout', 'refund');

-- CreateEnum
CREATE TYPE "WalletTransactionDirection" AS ENUM ('credit', 'debit');

-- CreateEnum
CREATE TYPE "WalletTransactionStatus" AS ENUM ('pending', 'available', 'cancelled', 'reversed');

-- CreateTable
CREATE TABLE "wallet_accounts" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "influencer_id" TEXT NOT NULL,
    "available_balance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "pending_balance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_received" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallet_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_transactions" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "influencer_id" TEXT NOT NULL,
    "wallet_account_id" TEXT NOT NULL,
    "type" "WalletTransactionType" NOT NULL,
    "direction" "WalletTransactionDirection" NOT NULL,
    "status" "WalletTransactionStatus" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "wallet_accounts_influencer_id_key" ON "wallet_accounts"("influencer_id");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_accounts_company_id_influencer_id_key" ON "wallet_accounts"("company_id", "influencer_id");

-- CreateIndex
CREATE INDEX "wallet_accounts_company_id_idx" ON "wallet_accounts"("company_id");

-- CreateIndex
CREATE INDEX "wallet_accounts_influencer_id_idx" ON "wallet_accounts"("influencer_id");

-- CreateIndex
CREATE INDEX "wallet_transactions_company_id_influencer_id_created_at_idx" ON "wallet_transactions"("company_id", "influencer_id", "created_at");

-- CreateIndex
CREATE INDEX "wallet_transactions_wallet_account_id_created_at_idx" ON "wallet_transactions"("wallet_account_id", "created_at");

-- CreateIndex
CREATE INDEX "wallet_transactions_company_id_type_idx" ON "wallet_transactions"("company_id", "type");

-- AddForeignKey
ALTER TABLE "wallet_accounts" ADD CONSTRAINT "wallet_accounts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_accounts" ADD CONSTRAINT "wallet_accounts_influencer_id_fkey" FOREIGN KEY ("influencer_id") REFERENCES "influencers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_influencer_id_fkey" FOREIGN KEY ("influencer_id") REFERENCES "influencers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_wallet_account_id_fkey" FOREIGN KEY ("wallet_account_id") REFERENCES "wallet_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
