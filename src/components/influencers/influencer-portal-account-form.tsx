"use client";

import { useActionState } from "react";
import { upsertInfluencerPortalAccountAction } from "@/app/actions/influencers";
import type { InfluencerRow } from "@/lib/influencers/repository";

type PortalAccountState = {
  error?: string;
  success?: string;
} | null;

export function InfluencerPortalAccountForm({
  influencer,
}: {
  influencer: InfluencerRow;
}) {
  const [state, formAction, pending] = useActionState<
    PortalAccountState,
    FormData
  >(upsertInfluencerPortalAccountAction, null);

  return (
    <form action={formAction} className="form">
      <input name="influencerId" type="hidden" value={influencer.id} />
      <div className="field">
        <label htmlFor="portalEmail">E-mail de acesso</label>
        <input
          defaultValue={influencer.email}
          id="portalEmail"
          name="email"
          required
          type="email"
        />
      </div>
      <div className="field-grid">
        <div className="field">
          <label htmlFor="portalPassword">Senha</label>
          <input
            id="portalPassword"
            minLength={8}
            name="password"
            required
            type="password"
          />
        </div>
        <div className="field">
          <label htmlFor="portalStatus">Status</label>
          <select id="portalStatus" name="status" defaultValue="active">
            <option value="active">Ativa</option>
            <option value="inactive">Inativa</option>
          </select>
        </div>
      </div>
      {state?.error ? <p className="error">{state.error}</p> : null}
      {state?.success ? <p className="muted">{state.success}</p> : null}
      <button className="button primary-action" type="submit" disabled={pending}>
        {pending ? "Salvando..." : "Salvar acesso ao portal"}
      </button>
    </form>
  );
}
