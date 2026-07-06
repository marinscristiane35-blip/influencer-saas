"use client";

import { useActionState } from "react";
import { updateInfluencerAction } from "@/app/actions/influencers";
import type { InfluencerRow } from "@/lib/influencers/repository";

type FormState = {
  error?: string;
  success?: string;
} | null;

export function InfluencerProfileForm({
  influencer,
}: {
  influencer: InfluencerRow;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    updateInfluencerAction,
    null,
  );

  return (
    <form action={formAction} className="form influencer-form">
      <input name="influencerId" type="hidden" value={influencer.id} />
      <div className="field-grid">
        <div className="field">
          <label htmlFor="name">Nome</label>
          <input
            defaultValue={influencer.name}
            id="name"
            name="name"
            required
          />
        </div>
        <div className="field">
          <label htmlFor="email">E-mail</label>
          <input
            defaultValue={influencer.email}
            id="email"
            name="email"
            required
            type="email"
          />
        </div>
      </div>
      <div className="field-grid">
        <div className="field">
          <label htmlFor="phone">Telefone</label>
          <input defaultValue={influencer.phone ?? ""} id="phone" name="phone" />
        </div>
        <div className="field">
          <label htmlFor="instagram">Instagram</label>
          <input
            defaultValue={
              influencer.instagram ? `@${influencer.instagram}` : ""
            }
            id="instagram"
            name="instagram"
          />
        </div>
      </div>
      <div className="field-grid">
        <div className="field">
          <label htmlFor="status">Status</label>
          <select id="status" name="status" defaultValue={influencer.status}>
            <option value="active">Ativo</option>
            <option value="invited">Convidado</option>
            <option value="paused">Pausado</option>
            <option value="declined">Recusado</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="couponCode">Cupom</label>
          <input
            defaultValue={influencer.coupon_code ?? ""}
            id="couponCode"
            name="couponCode"
          />
        </div>
      </div>
      <div className="field">
        <label htmlFor="notes">Observacoes</label>
        <textarea
          defaultValue={influencer.notes ?? ""}
          id="notes"
          name="notes"
          rows={4}
        />
      </div>
      {state?.error ? <p className="error">{state.error}</p> : null}
      {state?.success ? <p className="muted">{state.success}</p> : null}
      <button className="button primary-action" type="submit" disabled={pending}>
        {pending ? "Salvando..." : "Salvar alteracoes"}
      </button>
    </form>
  );
}
