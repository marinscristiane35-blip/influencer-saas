import {
  createChallengeAction,
  createChallengeScoreAction,
  reviewChallengeSubmissionAction,
} from "@/app/actions/challenges";
import { ChallengeForm } from "@/components/challenge-form";
import {
  type ChallengeRankingRow,
  listChallengeRanking,
  listCompanyChallengeSubmissions,
  listCompanyChallenges,
} from "@/lib/challenges/repository";
import { listInfluencersByCompany } from "@/lib/influencers/repository";
import { requireCompanyPermission } from "@/lib/tenant/context";

const statusLabels = {
  active: "Ativo",
  cancelled: "Cancelado",
  draft: "Rascunho",
  finished: "Finalizado",
} as const;

const submissionStatusLabels = {
  approved: "Aprovado",
  pending: "Pendente",
  rejected: "Recusado",
} as const;

function shortDate(value: Date | null) {
  return value ? new Intl.DateTimeFormat("pt-BR").format(value) : "-";
}

export default async function DashboardChallengesPage() {
  const tenant = await requireCompanyPermission("challenges:view");
  const canManage = tenant.can("challenges:manage");
  const [challenges, submissions, influencers] = await Promise.all([
    listCompanyChallenges(tenant.companyId),
    listCompanyChallengeSubmissions({ companyId: tenant.companyId }),
    listInfluencersByCompany(tenant.companyId),
  ]);
  const rankingEntries = await Promise.all(
    challenges.map(async (challenge): Promise<[string, ChallengeRankingRow[]]> => [
      challenge.id,
      await listChallengeRanking({
        challengeId: challenge.id,
        companyId: tenant.companyId,
      }),
    ]),
  );
  const rankings = new Map<string, ChallengeRankingRow[]>(
    rankingEntries,
  );

  return (
    <>
      <section className="page-heading compact-heading">
        <p className="eyebrow">Desafios</p>
        <h2>Operacao de desafios</h2>
        <p className="muted">
          Crie desafios, acompanhe envios dos influenciadores e pontue
          participacoes dentro da empresa atual.
        </p>
      </section>

      <section className="metric-grid section-gap">
        <article className="metric-card">
          <p>Desafios</p>
          <div className="metric">{challenges.length}</div>
          <span>Total cadastrado no tenant.</span>
        </article>
        <article className="metric-card">
          <p>Ativos</p>
          <div className="metric">
            {challenges.filter((challenge) => challenge.status === "active").length}
          </div>
          <span>Visiveis no portal.</span>
        </article>
        <article className="metric-card">
          <p>Envios pendentes</p>
          <div className="metric">
            {submissions.filter((submission) => submission.status === "pending").length}
          </div>
          <span>Aguardando analise da empresa.</span>
        </article>
        <article className="metric-card">
          <p>Envios totais</p>
          <div className="metric">{submissions.length}</div>
          <span>Historico preservado.</span>
        </article>
      </section>

      <div className="influencers-layout">
        {canManage ? (
          <section className="form-panel elevated-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">{tenant.company.name}</p>
                <h2>Novo desafio</h2>
              </div>
              <span className="panel-chip">MVP</span>
            </div>
            <ChallengeForm action={createChallengeAction} />
          </section>
        ) : null}

        <section className="form-panel elevated-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Pontuacao manual</p>
              <h2>Ajustar pontos</h2>
            </div>
          </div>
          {canManage && challenges.length > 0 && influencers.length > 0 ? (
            <form action={createChallengeScoreAction} className="form">
              <div className="field">
                <label htmlFor="challengeId">Desafio</label>
                <select id="challengeId" name="challengeId" required>
                  {challenges.map((challenge) => (
                    <option key={challenge.id} value={challenge.id}>
                      {challenge.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="influencerId">Influenciador</label>
                <select id="influencerId" name="influencerId" required>
                  {influencers
                    .filter((influencer) => !influencer.archived_at)
                    .map((influencer) => (
                      <option key={influencer.id} value={influencer.id}>
                        {influencer.name}
                      </option>
                    ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="points">Pontos</label>
                <input id="points" name="points" required type="number" />
              </div>
              <div className="field">
                <label htmlFor="note">Observacao</label>
                <input id="note" name="note" placeholder="Motivo do ajuste" />
              </div>
              <button className="button secondary-button" type="submit">
                Registrar pontos
              </button>
            </form>
          ) : (
            <div className="empty-state">
              <strong>Pontuacao indisponivel</strong>
              <p>Crie desafios e influenciadores para pontuar participacoes.</p>
            </div>
          )}
        </section>
      </div>

      <section className="form-panel elevated-panel list-panel section-gap">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Base da empresa</p>
            <h2>Desafios cadastrados</h2>
          </div>
          <span className="panel-chip">{challenges.length}</span>
        </div>
        {challenges.length === 0 ? (
          <div className="empty-state">
            <strong>Nenhum desafio criado ainda</strong>
            <p>Crie o primeiro desafio para liberar a experiencia no portal.</p>
          </div>
        ) : (
          <div className="challenge-card-list">
            {challenges.map((challenge) => {
              const ranking = rankings.get(challenge.id) ?? [];

              return (
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
                      <span>Periodo</span>
                      <strong>
                        {shortDate(challenge.starts_at)} ate{" "}
                        {shortDate(challenge.ends_at)}
                      </strong>
                    </div>
                  </div>
                  {challenge.prize_description ? (
                    <div className="challenge-prize">
                      Premio: {challenge.prize_description}
                    </div>
                  ) : null}
                  <div className="influencer-row-metrics">
                    <div>
                      <span>Participantes</span>
                      <strong>{ranking.length}</strong>
                    </div>
                    <div>
                      <span>Envios</span>
                      <strong>
                        {
                          submissions.filter(
                            (submission) =>
                              submission.challenge_id === challenge.id,
                          ).length
                        }
                      </strong>
                    </div>
                    <div>
                      <span>Lider</span>
                      <strong>
                        {ranking[0]?.influencer_name ?? "Sem ranking"}
                      </strong>
                      <small>
                        {ranking[0] ? `${ranking[0].total_points} pts` : ""}
                      </small>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="form-panel elevated-panel list-panel section-gap">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Envios</p>
            <h2>Comprovantes recebidos</h2>
          </div>
          <span className="panel-chip">{submissions.length}</span>
        </div>
        {submissions.length === 0 ? (
          <div className="empty-state">
            <strong>Nenhum envio recebido</strong>
            <p>Os links enviados pelos influenciadores aparecerao aqui.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Envio</th>
                  <th>Influenciador</th>
                  <th>Status</th>
                  <th>Link</th>
                  {canManage ? <th>Analise</th> : null}
                </tr>
              </thead>
              <tbody>
                {submissions.map((submission) => (
                  <tr key={submission.id}>
                    <td>
                      <strong>{submission.challenge_title}</strong>
                      <span className="table-note">{submission.description}</span>
                      <span className="table-note">
                        {shortDate(submission.created_at)}
                      </span>
                    </td>
                    <td>
                      <strong>{submission.influencer_name}</strong>
                      <span className="table-note">{submission.influencer_email}</span>
                    </td>
                    <td>{submissionStatusLabels[submission.status]}</td>
                    <td>
                      {submission.link_url ? (
                        <a className="text-link" href={submission.link_url} target="_blank">
                          Abrir link
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                    {canManage ? (
                      <td>
                        {submission.status === "pending" ? (
                          <div className="review-actions">
                            <form action={reviewChallengeSubmissionAction}>
                              <input name="submissionId" type="hidden" value={submission.id} />
                              <input name="status" type="hidden" value="approved" />
                              <input
                                aria-label="Pontos"
                                min="0"
                                name="points"
                                placeholder="Pts"
                                type="number"
                              />
                              <input
                                aria-label="Observacao"
                                name="reviewNote"
                                placeholder="Obs."
                              />
                              <button className="button" type="submit">
                                Aprovar
                              </button>
                            </form>
                            <form action={reviewChallengeSubmissionAction}>
                              <input name="submissionId" type="hidden" value={submission.id} />
                              <input name="status" type="hidden" value="rejected" />
                              <input
                                aria-label="Motivo"
                                name="reviewNote"
                                placeholder="Motivo"
                              />
                              <button className="button danger-button" type="submit">
                                Reprovar
                              </button>
                            </form>
                          </div>
                        ) : (
                          <span className="table-note">
                            {submission.review_note ?? "Ja analisado"}
                          </span>
                        )}
                      </td>
                    ) : null}
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
