"use client";

import { useActionState } from "react";
import { importOrdersCsvAction } from "@/app/actions/wallet";

type ImportState = {
  error?: string;
  success?: string;
  result?: {
    duplicateOrders: number;
    generatedCommission: string;
    importedOrders: number;
    matchedOrders: number;
    skippedRows: number;
    totalRows: number;
    unmatchedOrders: number;
  };
} | null;

function money(value: string | number) {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency",
  }).format(Number(value));
}

export function OrdersImportForm() {
  const [state, formAction, pending] = useActionState<ImportState, FormData>(
    importOrdersCsvAction,
    null,
  );

  return (
    <form action={formAction} className="form">
      <div className="field">
        <label htmlFor="ordersFile">Arquivo CSV</label>
        <input
          accept=".csv,text/csv,text/plain"
          id="ordersFile"
          name="ordersFile"
          required
          type="file"
        />
      </div>
      <p className="muted">
        Colunas: external_id, customer_email, coupon_code, gross_amount, status,
        ordered_at.
      </p>
      {state?.error ? <p className="error">{state.error}</p> : null}
      {state?.success ? <p className="muted">{state.success}</p> : null}
      {state?.result ? (
        <div className="import-summary">
          <span>Total: {state.result.totalRows}</span>
          <span>Novos: {state.result.importedOrders}</span>
          <span>Duplicados: {state.result.duplicateOrders}</span>
          <span>Com match: {state.result.matchedOrders}</span>
          <span>Sem match: {state.result.unmatchedOrders}</span>
          <span>Comissao: {money(state.result.generatedCommission)}</span>
        </div>
      ) : null}
      <button className="button primary-action" type="submit" disabled={pending}>
        {pending ? "Importando..." : "Importar pedidos"}
      </button>
    </form>
  );
}
