import Link from "next/link";
import { requireInfluencer } from "@/lib/auth/guards";
import {
  listInfluencerChallengeSubmissions,
  listPortalChallenges,
} from "@/lib/challenges/repository";

const submissionStatusLabels = {
  approved: "Aprovado",
  pending: "Aguardando analise",
  rejected: "Recusado",
} as const;

function shortDate(value: Date | null) {
  return value ? new Intl.DateTimeFormat("pt-BR").format(value) : "-";
}

export default async function PortalChallengesPage() {
  const context = await requireInfluencer();
  const [challenges, submissions] = await Promise.all([
    listPortalChallenges({
      companyId: context.companyId,
      influencerId: context.influencerId,
    }),
    listInfluencerChallengeSubmissions({
      companyId: context.companyId,
      influencerId: context.influencerId,
    }),
  ]);

  return (
    <>
      <section className="page-heading compact-heading">
        <p className="eyebrow">Desafios</p>
        <h2>Desafios para participar</h2>
        <p className="muted">
          Veja desafios ativos, envie comprovantes e acompanhe pontos e ranking
          dentro da empresa.
        </p>
      </section>

      <section className="metric-grid section-gap">
        <article className="metric-card">
          <p>Desafios ativos</p>
          <div className="metric">{challenges.length}</div>
          <span>Liberados para participacao.</span>
        </article>
        <article className="metric-card">
          <p>Seus envios</p>
          <div className="metric">{submissions.length}</div>
          <span>Historico preservado.</span>
        </article>
        <article className="metric-card">
          <p>Pontos totais</p>
          <div className="metric">
            {challenges.reduce((total, challenge) => total + challenge.my_points, 0)}
          </div>
          <span>Soma dos desafios ativos exibidos.</span>
        </article>
      </section>

      <section className="form-panel elevated-panel section-gap">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">{context.companyName}</p>
            <h2>Desafios ativos</h2>
          </div>
          <span className="panel-chip">{challenges.length}</span>
        </div>
        {challenges.length === 0 ? (
          <div className="empty-state">
            <strong>Nenhum desafio ativo agora</strong>
            <p>Quando a empresa criar um desafio ativo, ele aparecera aqui.</p>
          </div>
        ) : (
          <div className="challenge-card-list">
            {challenges.map((challenge) => (
              <article className="challenge-card" key={challenge.id}>
                <div className="panel-heading">
                  <div>
                    <span className="status-badge status-active">Ativo</span>
                    <h3>{challenge.title}</h3>
                    <p>{challenge.description}</p>
                  </div>
                  <Link
                    className="button primary-action"
                    href={`/portal/desafios/${challenge.id}/enviar`}
                  >
                    Enviar comprovante
                  </Link>
                </div>
                {challenge.prize_description ? (
                  <div className="challenge-prize">
                    Premio: {challenge.prize_description}
                  </div>
                ) : null}
                <div className="influencer-row-metrics">
                  <div>
                    <span>Seus pontos</span>
                    <strong>{challenge.my_points}</strong>
                  </div>
                  <div>
                    <span>Sua posicao</span>
                    <strong>
                      {challenge.my_position
                        ? `#${challenge.my_position.toString()}`
                        : "Sem ranking"}
                    </strong>
                  </div>
                  <div>
                    <span>Seus envios</span>
                    <strong>{challenge.my_submissions_count.toString()}</strong>
                  </div>
                  <div>
                    <span>Periodo</span>
                    <strong>
                      {shortDate(challenge.starts_at)} ate {shortDate(challenge.ends_at)}
                    </strong>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="form-panel elevated-panel section-gap">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Historico</p>
            <h2>Seus envios</h2>
          </div>
          <span className="panel-chip">{submissions.length}</span>
        </div>
        {submissions.length === 0 ? (
          <div className="empty-state">
            <strong>Nenhum envio realizado</strong>
            <p>Envie um link de publicacao para participar de um desafio.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Desafio</th>
                  <th>Data</th>
                  <th>Status</th>
                  <th>Link</th>
                  <th>Retorno</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((submission) => (
                  <tr key={submission.id}>
                    <td>
                      <strong>{submission.challenge_title}</strong>
                      <span className="table-note">{submission.description}</span>
                    </td>
                    <td>{shortDate(submission.created_at)}</td>
                    <td>{submissionStatusLabels[submission.status]}</td>
                    <td>
                      {submission.link_url ? (
                        <a className="text-link" href={submission.link_url} target="_blank">
                          Abrir
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td>{submission.review_note ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
