"use client";

import { useActionState } from "react";
import { createCampaignAction } from "@/app/actions/campaigns";

type CampaignFormState = {
  error?: string;
  success?: string;
} | null;

export function CampaignForm() {
  const [state, formAction, pending] = useActionState<
    CampaignFormState,
    FormData
  >(createCampaignAction, null);

  return (
    <form action={formAction} className="form campaign-form">
      <div className="field">
        <label htmlFor="name">Nome</label>
        <input id="name" name="name" placeholder="Campanha de lancamento" required />
      </div>
      <div className="field">
        <label htmlFor="description">Descricao</label>
        <textarea id="description" name="description" rows={3} />
      </div>
      <div className="field">
        <label htmlFor="objective">Objetivo</label>
        <input id="objective" name="objective" placeholder="Vendas, alcance, leads" />
      </div>
      <div className="field-grid">
        <div className="field">
          <label htmlFor="status">Status</label>
          <select id="status" name="status" defaultValue="draft">
            <option value="draft">Rascunho</option>
            <option value="active">Ativa</option>
            <option value="paused">Pausada</option>
            <option value="finished">Finalizada</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="plannedBudget">Orcamento previsto</label>
          <input id="plannedBudget" name="plannedBudget" min="0" step="0.01" type="number" />
        </div>
      </div>
      <div className="field-grid">
        <div className="field">
          <label htmlFor="startsAt">Data de inicio</label>
          <input id="startsAt" name="startsAt" type="date" />
        </div>
        <div className="field">
          <label htmlFor="endsAt">Data de fim</label>
          <input id="endsAt" name="endsAt" type="date" />
        </div>
      </div>
      <div className="field">
        <label htmlFor="notes">Observacoes</label>
        <textarea id="notes" name="notes" rows={3} />
      </div>
      {state?.error ? <p className="error">{state.error}</p> : null}
      {state?.success ? <p className="muted">{state.success}</p> : null}
      <button className="button primary-action" type="submit" disabled={pending}>
        {pending ? "Salvando..." : "Criar campanha"}
      </button>
    </form>
  );
}
