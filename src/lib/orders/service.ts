import "server-only";

import { prepareCommissionEvent } from "@/lib/financial/service";
import {
  createImportedOrder,
  getCompanyImportSummary,
  listRecentInfluencerCommissionOrders,
  sumCurrentMonthInfluencerCommissions,
  type ImportedOrderStatus,
} from "@/lib/orders/repository";
import {
  createWalletTransaction,
  findWalletTransactionByCommissionEvent,
} from "@/lib/wallet/repository";
import { getOrCreateWalletAccount } from "@/lib/wallet/repository";

type CsvRow = Record<string, string>;

export type OrderImportResult = {
  totalRows: number;
  importedOrders: number;
  duplicateOrders: number;
  matchedOrders: number;
  unmatchedOrders: number;
  skippedRows: number;
  generatedCommission: string;
  errors: string[];
};

const requiredColumns = [
  "external_id",
  "customer_email",
  "coupon_code",
  "gross_amount",
  "status",
  "ordered_at",
];

function splitCsvLine(line: string) {
  const cells: string[] = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      quoted = !quoted;
      continue;
    }

    if ((char === "," || char === ";") && !quoted) {
      cells.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current.trim());
  return cells;
}

function parseCsv(text: string) {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error("O CSV precisa ter cabecalho e ao menos uma linha.");
  }

  const headers = splitCsvLine(lines[0]).map((header) => header.toLowerCase());
  const missing = requiredColumns.filter((column) => !headers.includes(column));

  if (missing.length > 0) {
    throw new Error(`Colunas obrigatorias ausentes: ${missing.join(", ")}.`);
  }

  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);

    return headers.reduce<CsvRow>((row, header, index) => {
      row[header] = cells[index]?.trim() ?? "";
      return row;
    }, {});
  });
}

function normalizeCouponCode(value: string) {
  const coupon = value.trim();

  return coupon ? coupon.toUpperCase() : null;
}

function normalizeMoney(value: string) {
  const trimmed = value.trim();
  const normalized = trimmed.includes(",")
    ? trimmed.replace(/\./g, "").replace(",", ".")
    : trimmed;
  const parsed = Number(normalized);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed.toFixed(2);
}

function normalizeStatus(value: string): ImportedOrderStatus | null {
  const status = value.trim().toLowerCase();

  if (["paid", "pago", "aprovado", "approved"].includes(status)) {
    return "paid";
  }

  if (["pending", "pendente"].includes(status)) {
    return "pending";
  }

  if (["cancelled", "canceled", "cancelado"].includes(status)) {
    return "cancelled";
  }

  if (["refunded", "reembolsado", "estornado"].includes(status)) {
    return "refunded";
  }

  return null;
}

function parseDate(value: string) {
  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function addMoney(left: string, right: string) {
  return (Number(left) + Number(right)).toFixed(2);
}

export async function importSpreadsheetOrders(input: {
  companyId: string;
  csvText: string;
}) {
  const rows = parseCsv(input.csvText);
  const result: OrderImportResult = {
    duplicateOrders: 0,
    errors: [],
    generatedCommission: "0.00",
    importedOrders: 0,
    matchedOrders: 0,
    skippedRows: 0,
    totalRows: rows.length,
    unmatchedOrders: 0,
  };

  for (const [index, row] of rows.entries()) {
    const line = index + 2;
    const externalId = row.external_id?.trim();
    const grossAmount = normalizeMoney(row.gross_amount ?? "");
    const status = normalizeStatus(row.status ?? "");
    const orderedAt = parseDate(row.ordered_at ?? "");
    const couponCode = normalizeCouponCode(row.coupon_code ?? "");

    if (!externalId || !grossAmount || !status || !orderedAt) {
      result.skippedRows += 1;
      result.errors.push(`Linha ${line}: dados obrigatorios invalidos.`);
      continue;
    }

    const order = await createImportedOrder({
      companyId: input.companyId,
      couponCode,
      customerEmail: row.customer_email?.trim() || null,
      externalId,
      grossAmount,
      orderedAt,
      rawPayload: row,
      status,
    });

    if (!order) {
      result.duplicateOrders += 1;
      continue;
    }

    result.importedOrders += 1;

    if (status !== "paid" || !couponCode) {
      result.unmatchedOrders += 1;
      continue;
    }

    try {
      const commission = await prepareCommissionEvent({
        baseAmount: grossAmount,
        companyId: input.companyId,
        couponCode,
        description: `Comissao do pedido ${externalId}`,
        metadata: { importedOrderId: order.id },
        orderedAt,
        sourceId: externalId,
        sourceType: "spreadsheet",
      });

      if (!commission) {
        result.unmatchedOrders += 1;
        continue;
      }

      const existingTransaction = await findWalletTransactionByCommissionEvent({
        commissionEventId: commission.id,
        companyId: input.companyId,
      });

      if (!existingTransaction) {
        await getOrCreateWalletAccount({
          companyId: input.companyId,
          influencerId: commission.influencer_id,
        });
        await createWalletTransaction({
          amount: commission.amount,
          commissionEventId: commission.id,
          companyId: input.companyId,
          description: `Comissao do pedido ${externalId}`,
          direction: "credit",
          influencerId: commission.influencer_id,
          metadata: { couponCode, importedOrderId: order.id },
          status: commission.status === "blocked" ? "pending" : "available",
          type: "commission",
        });
      }

      result.matchedOrders += 1;
      result.generatedCommission = addMoney(
        result.generatedCommission,
        commission.amount,
      );
    } catch (error) {
      result.skippedRows += 1;
      result.errors.push(
        `Linha ${line}: ${
          error instanceof Error ? error.message : "falha ao gerar comissao"
        }`,
      );
    }
  }

  return result;
}

export async function getDashboardFinancialSummary(companyId: string) {
  return getCompanyImportSummary(companyId);
}

export async function getInfluencerCommissionSummary(input: {
  companyId: string;
  influencerId: string;
}) {
  const [currentMonthCommission, recentOrders] = await Promise.all([
    sumCurrentMonthInfluencerCommissions(input),
    listRecentInfluencerCommissionOrders(input),
  ]);

  return {
    currentMonthCommission,
    recentOrders,
  };
}
