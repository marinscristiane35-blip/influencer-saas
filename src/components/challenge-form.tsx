"use client";

import { useActionState } from "react";

type ChallengeFormState = {
  error?: string;
  success?: string;
} | null;

export function ChallengeForm({
  action,
}: {
  action: (
    state: ChallengeFormState,
    formData: FormData,
  ) => Promise<ChallengeFormState>;
}) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="form campaign-form">
      <div className="field">
        <label htmlFor="title">Titulo</label>
        <input id="title" name="title" placeholder="Desafio da semana" required />
      </div>
      <div className="field">
        <label htmlFor="description">Regras do desafio</label>
        <textarea
          id="description"
          name="description"
          placeholder="Explique o que o influenciador precisa fazer."
          required
        />
      </div>
      <div className="field">
        <label htmlFor="prizeDescription">Premio</label>
        <input
          id="prizeDescription"
          name="prizeDescription"
          placeholder="Premio, bonus ou reconhecimento"
        />
      </div>
      <div className="field-grid">
        <div className="field">
          <label htmlFor="startsAt">Inicio</label>
          <input id="startsAt" name="startsAt" type="date" />
        </div>
        <div className="field">
          <label htmlFor="endsAt">Fim</label>
          <input id="endsAt" name="endsAt" type="date" />
        </div>
      </div>
      <div className="field">
        <label htmlFor="status">Status</label>
        <select id="status" name="status" defaultValue="active">
          <option value="draft">Rascunho</option>
          <option value="active">Ativo</option>
          <option value="finished">Finalizado</option>
          <option value="cancelled">Cancelado</option>
        </select>
      </div>
      {state?.error ? <p className="error">{state.error}</p> : null}
      {state?.success ? <p className="muted">{state.success}</p> : null}
      <button className="button primary-action" disabled={pending} type="submit">
        {pending ? "Salvando..." : "Criar desafio"}
      </button>
    </form>
  );
}
