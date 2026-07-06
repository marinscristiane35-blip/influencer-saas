"use client";

import { useActionState } from "react";
import { linkCampaignInfluencerAction } from "@/app/actions/campaigns";

type LinkState = {
  error?: string;
  success?: string;
} | null;

type Option = {
  id: string;
  name: string;
};

export function CampaignInfluencerLinkForm({
  campaigns,
  influencers,
}: {
  campaigns: Option[];
  influencers: Option[];
}) {
  const [state, formAction, pending] = useActionState<LinkState, FormData>(
    linkCampaignInfluencerAction,
    null,
  );

  return (
    <form action={formAction} className="form">
      <div className="field">
        <label htmlFor="campaignId">Campanha</label>
        <select id="campaignId" name="campaignId" required>
          <option value="">Selecione</option>
          {campaigns.map((campaign) => (
            <option key={campaign.id} value={campaign.id}>
              {campaign.name}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="influencerId">Influenciador</label>
        <select id="influencerId" name="influencerId" required>
          <option value="">Selecione</option>
          {influencers.map((influencer) => (
            <option key={influencer.id} value={influencer.id}>
              {influencer.name}
            </option>
          ))}
        </select>
      </div>
      {state?.error ? <p className="error">{state.error}</p> : null}
      {state?.success ? <p className="muted">{state.success}</p> : null}
      <button className="button primary-action" type="submit" disabled={pending}>
        {pending ? "Vinculando..." : "Vincular influenciador"}
      </button>
    </form>
  );
}
