"use client";

import { useActionState } from "react";
import { createInfluencerNoteAction } from "@/app/actions/influencers";

type NoteState = {
  error?: string;
  success?: string;
} | null;

export function InfluencerNoteForm({
  influencerId,
}: {
  influencerId: string;
}) {
  const [state, formAction, pending] = useActionState<NoteState, FormData>(
    createInfluencerNoteAction,
    null,
  );

  return (
    <form action={formAction} className="form">
      <input name="influencerId" type="hidden" value={influencerId} />
      <div className="field">
        <label htmlFor="description">Observacao interna</label>
        <textarea
          id="description"
          name="description"
          placeholder="Registre um ponto importante da operacao"
          required
          rows={4}
        />
      </div>
      {state?.error ? <p className="error">{state.error}</p> : null}
      {state?.success ? <p className="muted">{state.success}</p> : null}
      <button className="button primary-action" type="submit" disabled={pending}>
        {pending ? "Salvando..." : "Adicionar observacao"}
      </button>
    </form>
  );
}
