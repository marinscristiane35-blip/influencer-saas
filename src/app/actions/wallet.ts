"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { importSpreadsheetOrders } from "@/lib/orders/service";
import { requireCompanyPermission } from "@/lib/tenant/context";
import { createManualWalletTransaction } from "@/lib/wallet/service";

const manualTransactionSchema = z.object({
  influencerId: z.string().trim().min(1, "Selecione um influenciador."),
  type: z.enum(["bonus", "adjustment"]),
  direction: z.enum(["credit", "debit"]),
  status: z.enum(["available", "pending"]),
  amount: z.string().trim().min(1, "Informe o valor."),
  description: z.string().trim().min(3, "Informe uma descricao."),
});

export async function createManualWalletTransactionAction(
  _: unknown,
  formData: FormData,
) {
  const tenant = await requireCompanyPermission("finance:manual_transactions");
  const parsed = manualTransactionSchema.safeParse({
    amount: formData.get("amount"),
    description: formData.get("description"),
    direction: formData.get("direction"),
    influencerId: formData.get("influencerId"),
    status: formData.get("status"),
    type: formData.get("type"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados invalidos." };
  }

  try {
    await createManualWalletTransaction({
      amount: parsed.data.amount.replace(",", "."),
      companyId: tenant.companyId,
      description: parsed.data.description,
      direction: parsed.data.direction,
      influencerId: parsed.data.influencerId,
      status: parsed.data.status,
      type: parsed.data.type,
    });
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Nao foi possivel criar a transacao.",
    };
  }

  revalidatePath("/dashboard/financeiro");
  revalidatePath("/portal/carteira");
  return { success: "Transacao registrada no extrato." };
}

export async function importOrdersCsvAction(_: unknown, formData: FormData) {
  const tenant = await requireCompanyPermission("finance:import_orders");
  const file = formData.get("ordersFile");

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Selecione um arquivo CSV." };
  }

  if (
    file.type &&
    !["text/csv", "application/vnd.ms-excel", "text/plain"].includes(file.type)
  ) {
    return { error: "Envie um arquivo CSV valido." };
  }

  try {
    const result = await importSpreadsheetOrders({
      companyId: tenant.companyId,
      csvText: await file.text(),
    });

    revalidatePath("/dashboard/financeiro");
    revalidatePath("/portal/carteira");

    return {
      success: `Importacao concluida: ${result.importedOrders} pedidos novos, ${result.matchedOrders} com cupom encontrado, ${result.unmatchedOrders} sem match.`,
      result,
    };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Nao foi possivel importar os pedidos.",
    };
  }
}
