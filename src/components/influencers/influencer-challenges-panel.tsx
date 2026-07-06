import { shortDate } from "@/components/influencers/format";
import type { InfluencerChallengeParticipationRow } from "@/lib/challenges/repository";

const statusLabels = {
  active: "Ativo",
  cancelled: "Cancelado",
  draft: "Rascunho",
  finished: "Finalizado",
} as const;

const submissionLabels = {
  approved: "Aprovado",
  pending: "Pendente",
  rejected: "Recusado",
} as const;

export function InfluencerChallengesPanel({
  challenges,
}: {
  challenges: InfluencerChallengeParticipationRow[];
}) {
  return (
    <section className="form-panel elevated-panel section-gap">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Desafios</p>
          <h2>Participacao e pontuacao</h2>
        </div>
        <span className="panel-chip">{challenges.length}</span>
      </div>
      {challenges.length === 0 ? (
        <div className="empty-state">
          <strong>Nenhum desafio vinculado ainda</strong>
          <p>
            Quando houver desafio ativo ou pontuacao registrada, o historico
            aparecera aqui.
          </p>
        </div>
      ) : (
        <div className="challenge-card-list">
          {challenges.map((challenge) => (
            <article className="challenge-card" key={challenge.id}>
              <div className="panel-heading">
                <div>
                  <span className="status-badge status-active">
                    {statusLabels[challenge.status]}
                  </span>
                  <h3>{challenge.title}</h3>
                  <p>{challenge.description}</p>
                </div>
                <div className="challenge-meta">
                  <span>Posicao</span>
                  <strong>
                    {challenge.my_position
                      ? `#${challenge.my_position.toString()}`
                      : "Sem ranking"}
                  </strong>
                </div>
              </div>
              <div className="influencer-row-metrics">
                <div>
                  <span>Pontos</span>
                  <strong>{challenge.my_points}</strong>
                </div>
                <div>
                  <span>Envios</span>
                  <strong>{challenge.my_submissions_count.toString()}</strong>
                </div>
                <div>
                  <span>Ultimo envio</span>
                  <strong>
                    {challenge.latest_submission_status
                      ? submissionLabels[challenge.latest_submission_status]
                      : "Sem envio"}
                  </strong>
                  <small>{shortDate(challenge.latest_submission_created_at)}</small>
                </div>
                <div>
                  <span>Link</span>
                  <strong>{challenge.latest_submission_link_url ? "Enviado" : "-"}</strong>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
