"use client";

import { useActionState } from "react";
import { createManualWalletTransactionAction } from "@/app/actions/wallet";

type InfluencerOption = {
  id: string;
  name: string;
  email: string;
};

type WalletFormState = {
  error?: string;
  success?: string;
} | null;

export function ManualWalletTransactionForm({
  influencers,
}: {
  influencers: InfluencerOption[];
}) {
  const [state, formAction, pending] = useActionState<WalletFormState, FormData>(
    createManualWalletTransactionAction,
    null,
  );

  return (
    <form action={formAction} className="form">
      <div className="field">
        <label htmlFor="influencerId">Influenciador</label>
        <select id="influencerId" name="influencerId" required>
          <option value="">Selecione</option>
          {influencers.map((influencer) => (
            <option key={influencer.id} value={influencer.id}>
              {influencer.name} - {influencer.email}
            </option>
          ))}
        </select>
      </div>
      <div className="field-grid">
        <div className="field">
          <label htmlFor="type">Tipo</label>
          <select id="type" name="type" defaultValue="bonus">
            <option value="bonus">Bonus</option>
            <option value="adjustment">Ajuste</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="direction">Movimento</label>
          <select id="direction" name="direction" defaultValue="credit">
            <option value="credit">Credito</option>
            <option value="debit">Debito</option>
          </select>
        </div>
      </div>
      <div className="field-grid">
        <div className="field">
          <label htmlFor="status">Saldo</label>
          <select id="status" name="status" defaultValue="available">
            <option value="available">Disponivel</option>
            <option value="pending">Pendente</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="amount">Valor</label>
          <input
            id="amount"
            min="0.01"
            name="amount"
            placeholder="100,00"
            required
            step="0.01"
            type="number"
          />
        </div>
      </div>
      <div className="field">
        <label htmlFor="description">Descricao</label>
        <textarea
          id="description"
          name="description"
          placeholder="Motivo do bonus ou ajuste"
          required
          rows={3}
        />
      </div>
      {state?.error ? <p className="error">{state.error}</p> : null}
      {state?.success ? <p className="muted">{state.success}</p> : null}
      <button className="button primary-action" type="submit" disabled={pending}>
        {pending ? "Registrando..." : "Registrar transacao"}
      </button>
    </form>
  );
}
