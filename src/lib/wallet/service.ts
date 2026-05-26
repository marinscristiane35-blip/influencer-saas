import "server-only";

import {
  createWalletTransaction,
  getInfluencerWallet,
  getOrCreateWalletAccount,
  listCompanyWalletSummaries,
  listWalletTransactions,
  type WalletTransactionDirection,
  type WalletTransactionStatus,
  type WalletTransactionType,
} from "@/lib/wallet/repository";

function assertPositiveAmount(amount: string) {
  const parsed = Number(amount);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error("Informe um valor positivo.");
  }

  return parsed.toFixed(2);
}

export async function getInfluencerWalletStatement(input: {
  companyId: string;
  influencerId: string;
}) {
  const wallet = await getInfluencerWallet(input);

  if (!wallet) {
    throw new Error("Carteira nao encontrada.");
  }

  const transactions = await listWalletTransactions({
    companyId: input.companyId,
    influencerId: input.influencerId,
  });

  return {
    transactions,
    wallet,
  };
}

export async function listCompanyWallets(companyId: string) {
  return listCompanyWalletSummaries(companyId);
}

export async function createManualWalletTransaction(input: {
  companyId: string;
  influencerId: string;
  type: Extract<WalletTransactionType, "bonus" | "adjustment">;
  direction: WalletTransactionDirection;
  status: Extract<WalletTransactionStatus, "available" | "pending">;
  amount: string;
  description: string;
}) {
  const amount = assertPositiveAmount(input.amount);
  const wallet = await getOrCreateWalletAccount({
    companyId: input.companyId,
    influencerId: input.influencerId,
  });

  if (!wallet) {
    throw new Error("Influenciador nao encontrado nesta empresa.");
  }

  if (input.direction === "debit" && input.status === "available") {
    const available = Number(wallet.available_balance);

    if (available < Number(amount)) {
      throw new Error("Saldo disponivel insuficiente.");
    }
  }

  if (input.direction === "debit" && input.status === "pending") {
    const pending = Number(wallet.pending_balance);

    if (pending < Number(amount)) {
      throw new Error("Saldo pendente insuficiente.");
    }
  }

  return createWalletTransaction({
    amount,
    companyId: input.companyId,
    description: input.description,
    direction: input.direction,
    influencerId: input.influencerId,
    metadata: { origin: "manual" },
    status: input.status,
    type: input.type,
  });
}
