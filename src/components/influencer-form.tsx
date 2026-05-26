"use client";

import { useActionState } from "react";
import { createInfluencerAction } from "@/app/actions/influencers";

type InfluencerFormState = {
  error?: string;
  success?: string;
} | null;

export function InfluencerForm() {
  const [state, formAction, pending] = useActionState<
    InfluencerFormState,
    FormData
  >(createInfluencerAction, null);

  return (
    <form action={formAction} className="form influencer-form">
      <div className="field">
        <label htmlFor="name">Nome</label>
        <input id="name" name="name" placeholder="Nome completo" required />
      </div>
      <div className="field">
        <label htmlFor="email">E-mail</label>
        <input id="email" name="email" placeholder="email@empresa.com" type="email" required />
      </div>
      <div className="field">
        <label htmlFor="phone">Telefone</label>
        <input id="phone" name="phone" placeholder="(00) 00000-0000" />
      </div>
      <div className="field">
        <label htmlFor="instagram">Instagram</label>
        <input id="instagram" name="instagram" placeholder="@perfil" />
      </div>
      <div className="field">
        <label htmlFor="status">Status</label>
        <select id="status" name="status" defaultValue="invited">
          <option value="active">Ativo</option>
          <option value="invited">Convidado</option>
          <option value="paused">Pausado</option>
          <option value="declined">Recusado</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="couponCode">Cupom/codigo</label>
        <input id="couponCode" name="couponCode" placeholder="CODIGO10" />
      </div>
      <div className="field">
        <label htmlFor="notes">Observacoes</label>
        <textarea id="notes" name="notes" rows={4} />
      </div>
      {state?.error ? <p className="error">{state.error}</p> : null}
      {state?.success ? <p className="muted">{state.success}</p> : null}
      <button className="button primary-action" type="submit" disabled={pending}>
        {pending ? "Salvando..." : "Cadastrar influenciador"}
      </button>
    </form>
  );
}
