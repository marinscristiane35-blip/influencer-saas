import Link from "next/link";
import { submitChallengeAction } from "@/app/actions/challenges";
import { ChallengeSubmissionForm } from "@/components/challenge-submission-form";
import { requireInfluencer } from "@/lib/auth/guards";
import {
  findChallengeByCompany,
  listInfluencerChallengeSubmissions,
} from "@/lib/challenges/repository";

function shortDate(value: Date | null) {
  return value ? new Intl.DateTimeFormat("pt-BR").format(value) : "-";
}

export default async function PortalChallengeSubmitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [{ id }, context] = await Promise.all([params, requireInfluencer()]);
  const [challenge, submissions] = await Promise.all([
    findChallengeByCompany({
      challengeId: id,
      companyId: context.companyId,
    }),
    listInfluencerChallengeSubmissions({
      challengeId: id,
      companyId: context.companyId,
      influencerId: context.influencerId,
    }),
  ]);

  if (!challenge || challenge.status !== "active") {
    return (
      <section className="form-panel elevated-panel">
        <p className="eyebrow">Desafio indisponivel</p>
        <h2>Este desafio nao esta ativo</h2>
        <p className="muted">
          Volte para a lista de desafios e escolha uma opcao ativa.
        </p>
        <Link className="button secondary-button" href="/portal/desafios">
          Voltar
        </Link>
      </section>
    );
  }

  return (
    <>
      <section className="page-heading compact-heading">
        <Link className="text-link" href="/portal/desafios">
          Voltar
        </Link>
        <p className="eyebrow">Enviar comprovante</p>
        <h2>{challenge.title}</h2>
        <p className="muted">{challenge.description}</p>
      </section>

      <div className="influencers-layout">
        <section className="form-panel elevated-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">{context.companyName}</p>
              <h2>Novo envio</h2>
            </div>
            <span className="panel-chip">
              ate {shortDate(challenge.ends_at)}
            </span>
          </div>
          {challenge.prize_description ? (
            <div className="challenge-prize">
              Premio: {challenge.prize_description}
            </div>
          ) : null}
          <ChallengeSubmissionForm
            action={submitChallengeAction}
            challengeId={challenge.id}
          />
        </section>

        <section className="form-panel elevated-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Historico</p>
              <h2>Seus envios neste desafio</h2>
            </div>
            <span className="panel-chip">{submissions.length}</span>
          </div>
          {submissions.length === 0 ? (
            <div className="empty-state">
              <strong>Nenhum envio ainda</strong>
              <p>Envie uma descricao e o link da publicacao.</p>
            </div>
          ) : (
            <div className="timeline-list">
              {submissions.map((submission) => (
                <article className="timeline-item" key={submission.id}>
                  <div>
                    <strong>{submission.description}</strong>
                    <p>{submission.link_url ?? "Sem link"}</p>
                    <span>{shortDate(submission.created_at)}</span>
                  </div>
                  <span className="panel-chip">{submission.status}</span>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
