import { InfluencerProfileForm } from "@/components/influencer-profile-form";
import { InfluencerNoteForm } from "@/components/influencers/influencer-note-form";
import { InfluencerPortalAccountForm } from "@/components/influencers/influencer-portal-account-form";
import type { InfluencerRow } from "@/lib/influencers/repository";

export function InfluencerSidePanel({
  canUpdate,
  influencer,
}: {
  canUpdate: boolean;
  influencer: InfluencerRow;
}) {
  return (
    <div className="side-stack">
      <section className="form-panel elevated-panel" id="editar">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Cadastro</p>
            <h2>Dados do influenciador</h2>
          </div>
          <span className="panel-chip">{influencer.coupon_code ?? "Sem cupom"}</span>
        </div>
        {canUpdate ? (
          <InfluencerProfileForm influencer={influencer} />
        ) : (
          <div className="empty-state">
            <strong>Somente leitura</strong>
            <p>Seu perfil nao possui permissao para editar influenciadores.</p>
          </div>
        )}
      </section>

      <section className="form-panel elevated-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Portal</p>
            <h2>Acesso do influenciador</h2>
          </div>
        </div>
        {canUpdate ? (
          <InfluencerPortalAccountForm influencer={influencer} />
        ) : (
          <div className="empty-state">
            <strong>Sem permissao</strong>
            <p>Contas do portal exigem permissao de edicao.</p>
          </div>
        )}
      </section>

      <section className="form-panel elevated-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Observacoes</p>
            <h2>Nota interna</h2>
          </div>
        </div>
        {canUpdate ? (
          <InfluencerNoteForm influencerId={influencer.id} />
        ) : (
          <div className="empty-state">
            <strong>Sem permissao</strong>
            <p>Observacoes internas exigem permissao de edicao.</p>
          </div>
        )}
      </section>
    </div>
  );
}
