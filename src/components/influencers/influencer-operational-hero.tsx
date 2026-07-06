import Link from "next/link";
import { changeInfluencerStatusAction } from "@/app/actions/influencers";
import type { InfluencerRow } from "@/lib/influencers/repository";
import { money, shortDate } from "@/components/influencers/format";

const statusLabels = {
  active: "Ativo",
  declined: "Recusado",
  invited: "Convidado",
  paused: "Pausado",
} as const;

const statusClasses = {
  active: "status-badge status-active",
  declined: "status-badge status-declined",
  invited: "status-badge status-invited",
  paused: "status-badge status-paused",
} as const;

export function InfluencerOperationalHero({
  canArchive,
  canChangeStatus,
  canUpdate,
  currentMonthCommission,
  influencer,
  saldoDisponivel,
}: {
  canArchive: boolean;
  canChangeStatus: boolean;
  canUpdate: boolean;
  currentMonthCommission: string;
  influencer: InfluencerRow;
  saldoDisponivel: string | null;
}) {
  const initials = influencer.name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <section className="profile-hero operational-hero">
      <div className="hero-identity">
        <div className="avatar-placeholder">{initials}</div>
        <div>
          <Link className="text-link" href="/dashboard/influenciadores">
            Voltar
          </Link>
          <p className="eyebrow">Perfil operacional</p>
          <h2>{influencer.name}</h2>
          <p className="muted">
            {influencer.email}
            {influencer.instagram ? ` · @${influencer.instagram}` : ""}
          </p>
          <div className="hero-badges">
            <span className={statusClasses[influencer.status]}>
              {statusLabels[influencer.status]}
            </span>
            {influencer.archived_at ? (
              <span className="status-badge status-declined">Arquivado</span>
            ) : null}
            <span className="panel-chip">{influencer.coupon_code ?? "Sem cupom"}</span>
          </div>
        </div>
      </div>
      <div className="hero-metrics">
        <div>
          <span>Comissao do mes</span>
          <strong>{money(currentMonthCommission)}</strong>
        </div>
        <div>
          <span>Saldo disponivel</span>
          <strong>{saldoDisponivel ? money(saldoDisponivel) : "Restrito"}</strong>
        </div>
        <div>
          <span>Entrada</span>
          <strong>{shortDate(influencer.created_at)}</strong>
        </div>
      </div>
      <div className="profile-actions">
        {canUpdate ? <a className="button secondary-button" href="#editar">Editar</a> : null}
        {canChangeStatus ? (
          <>
            <form action={changeInfluencerStatusAction}>
              <input name="influencerId" type="hidden" value={influencer.id} />
              <input name="intent" type="hidden" value="pause" />
              <button className="button secondary-button" type="submit">
                Pausar
              </button>
            </form>
            <form action={changeInfluencerStatusAction}>
              <input name="influencerId" type="hidden" value={influencer.id} />
              <input name="intent" type="hidden" value="reactivate" />
              <button className="button" type="submit">
                Reativar
              </button>
            </form>
          </>
        ) : null}
        {canArchive ? (
          <form action={changeInfluencerStatusAction}>
            <input name="influencerId" type="hidden" value={influencer.id} />
            <input
              name="intent"
              type="hidden"
              value={influencer.archived_at ? "unarchive" : "archive"}
            />
            <button
              className={influencer.archived_at ? "button" : "button danger-button"}
              type="submit"
            >
              {influencer.archived_at ? "Desarquivar" : "Arquivar"}
            </button>
          </form>
        ) : null}
      </div>
    </section>
  );
}
