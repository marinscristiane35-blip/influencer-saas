"use client";

import { useActionState } from "react";

type SubmissionFormState = {
  error?: string;
} | null;

export function ChallengeSubmissionForm({
  action,
  challengeId,
}: {
  action: (
    state: SubmissionFormState,
    formData: FormData,
  ) => Promise<SubmissionFormState>;
  challengeId: string;
}) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="form campaign-form">
      <input name="challengeId" type="hidden" value={challengeId} />
      <div className="field">
        <label htmlFor="description">Descricao do envio</label>
        <textarea
          id="description"
          name="description"
          placeholder="Conte o que foi feito neste desafio."
          required
        />
      </div>
      <div className="field">
        <label htmlFor="linkUrl">Link da publicacao</label>
        <input
          id="linkUrl"
          name="linkUrl"
          placeholder="https://instagram.com/..."
          type="url"
        />
      </div>
      {state?.error ? <p className="error">{state.error}</p> : null}
      <button className="button primary-action" disabled={pending} type="submit">
        {pending ? "Enviando..." : "Enviar comprovante"}
      </button>
    </form>
  );
}
