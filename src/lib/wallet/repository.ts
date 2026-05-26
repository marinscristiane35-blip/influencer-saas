import "server-only";

import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/database/prisma";

export type WalletTransactionType =
  | "commission"
  | "bonus"
  | "adjustment"
  | "payout"
  | "refund";

export type WalletTransactionDirection = "credit" | "debit";
export type WalletTransactionStatus =
  | "pending"
  | "available"
  | "cancelled"
  | "reversed";

export type WalletAccountRow = {
  id: string;
  company_id: string;
  influencer_id: string;
  available_balance: string;
  pending_balance: string;
  total_received: string;
  created_at: Date;
  updated_at: Date;
};

export type WalletTransactionRow = {
  id: string;
  company_id: string;
  influencer_id: string;
  wallet_account_id: string;
  commission_event_id: string | null;
  type: WalletTransactionType;
  direction: WalletTransactionDirection;
  status: WalletTransactionStatus;
  amount: string;
  description: string | null;
  metadata: unknown | null;
  occurred_at: Date;
  created_at: Date;
};

export type CompanyWalletSummaryRow = WalletAccountRow & {
  influencer_name: string;
  influencer_email: string;
  influencer_status: string;
};

export async function getOrCreateWalletAccount(input: {
  companyId: string;
  influencerId: string;
}) {
  return prisma.$transaction(async (tx) => {
    const influencers = await tx.$queryRaw<Array<{ id: string }>>`
      SELECT id
      FROM influencers
      WHERE id = ${input.influencerId}
        AND company_id = ${input.companyId}
      LIMIT 1
    `;

    if (!influencers[0]) {
      return null;
    }

    await tx.$executeRaw`
      INSERT INTO wallet_accounts (
        id,
        company_id,
        influencer_id,
        updated_at
      )
      VALUES (
        ${randomUUID()},
        ${input.companyId},
        ${input.influencerId},
        now()
      )
      ON CONFLICT (company_id, influencer_id) DO NOTHING
    `;

    const accounts = await tx.$queryRaw<WalletAccountRow[]>`
      SELECT
        id,
        company_id,
        influencer_id,
        available_balance::text,
        pending_balance::text,
        total_received::text,
        created_at,
        updated_at
      FROM wallet_accounts
      WHERE company_id = ${input.companyId}
        AND influencer_id = ${input.influencerId}
      LIMIT 1
    `;

    return accounts[0] ?? null;
  });
}

export async function getInfluencerWallet(input: {
  companyId: string;
  influencerId: string;
}) {
  return getOrCreateWalletAccount(input);
}

export async function listWalletTransactions(input: {
  companyId: string;
  influencerId: string;
  limit?: number;
}) {
  const limit = Math.min(Math.max(input.limit ?? 50, 1), 100);

  return prisma.$queryRaw<WalletTransactionRow[]>`
    SELECT
      id,
      company_id,
      influencer_id,
      wallet_account_id,
      commission_event_id,
      type,
      direction,
      status,
      amount::text,
      description,
      metadata,
      occurred_at,
      created_at
    FROM wallet_transactions
    WHERE company_id = ${input.companyId}
      AND influencer_id = ${input.influencerId}
    ORDER BY occurred_at DESC, created_at DESC
    LIMIT ${limit}
  `;
}

export async function createWalletTransaction(input: {
  companyId: string;
  influencerId: string;
  type: WalletTransactionType;
  direction: WalletTransactionDirection;
  status: WalletTransactionStatus;
  amount: string;
  description: string | null;
  metadata?: Record<string, unknown> | null;
  commissionEventId?: string | null;
}) {
  return prisma.$transaction(async (tx) => {
    const accounts = await tx.$queryRaw<WalletAccountRow[]>`
      SELECT
        id,
        company_id,
        influencer_id,
        available_balance::text,
        pending_balance::text,
        total_received::text,
        created_at,
        updated_at
      FROM wallet_accounts
      WHERE company_id = ${input.companyId}
        AND influencer_id = ${input.influencerId}
      FOR UPDATE
    `;

    const account = accounts[0];

    if (!account) {
      throw new Error("Carteira nao encontrada para este tenant.");
    }

    const amount = Number(input.amount);
    const availableBalance = Number(account.available_balance);
    const pendingBalance = Number(account.pending_balance);

    if (input.direction === "debit" && input.status === "available" && availableBalance < amount) {
      throw new Error("Saldo disponivel insuficiente.");
    }

    if (input.direction === "debit" && input.status === "pending" && pendingBalance < amount) {
      throw new Error("Saldo pendente insuficiente.");
    }

    const transactionId = randomUUID();
    const metadata = input.metadata ? JSON.stringify(input.metadata) : null;

    await tx.$executeRaw`
      INSERT INTO wallet_transactions (
        id,
        company_id,
        influencer_id,
        wallet_account_id,
        commission_event_id,
        type,
        direction,
        status,
        amount,
        description,
        metadata
      )
      VALUES (
        ${transactionId},
        ${input.companyId},
        ${input.influencerId},
        ${account.id},
        ${input.commissionEventId ?? null},
        ${input.type}::"WalletTransactionType",
        ${input.direction}::"WalletTransactionDirection",
        ${input.status}::"WalletTransactionStatus",
        ${input.amount}::decimal,
        ${input.description},
        ${metadata}::jsonb
      )
    `;

    const availableDelta =
      input.status === "available"
        ? input.direction === "credit"
          ? input.amount
          : `-${input.amount}`
        : "0";
    const pendingDelta =
      input.status === "pending"
        ? input.direction === "credit"
          ? input.amount
          : `-${input.amount}`
        : "0";
    const receivedDelta =
      input.status === "available" && input.direction === "credit"
        ? input.amount
        : "0";

    await tx.$executeRaw`
      UPDATE wallet_accounts
      SET
        available_balance = available_balance + ${availableDelta}::decimal,
        pending_balance = pending_balance + ${pendingDelta}::decimal,
        total_received = total_received + ${receivedDelta}::decimal,
        updated_at = now()
      WHERE id = ${account.id}
    `;

    const transactions = await tx.$queryRaw<WalletTransactionRow[]>`
      SELECT
        id,
        company_id,
        influencer_id,
        wallet_account_id,
        commission_event_id,
        type,
        direction,
        status,
        amount::text,
        description,
        metadata,
        occurred_at,
        created_at
      FROM wallet_transactions
      WHERE id = ${transactionId}
      LIMIT 1
    `;

    return transactions[0] ?? null;
  });
}

export async function findWalletTransactionByCommissionEvent(input: {
  companyId: string;
  commissionEventId: string;
}) {
  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id
    FROM wallet_transactions
    WHERE company_id = ${input.companyId}
      AND commission_event_id = ${input.commissionEventId}
    LIMIT 1
  `;

  return rows[0] ?? null;
}

export async function listCompanyWalletSummaries(companyId: string) {
  return prisma.$queryRaw<CompanyWalletSummaryRow[]>`
    SELECT
      wallet_accounts.id,
      wallet_accounts.company_id,
      wallet_accounts.influencer_id,
      wallet_accounts.available_balance::text,
      wallet_accounts.pending_balance::text,
      wallet_accounts.total_received::text,
      wallet_accounts.created_at,
      wallet_accounts.updated_at,
      influencers.name AS influencer_name,
      influencers.email AS influencer_email,
      influencers.status::text AS influencer_status
    FROM wallet_accounts
    INNER JOIN influencers ON influencers.id = wallet_accounts.influencer_id
      AND influencers.company_id = wallet_accounts.company_id
    WHERE wallet_accounts.company_id = ${companyId}
    ORDER BY wallet_accounts.updated_at DESC
  `;
}
