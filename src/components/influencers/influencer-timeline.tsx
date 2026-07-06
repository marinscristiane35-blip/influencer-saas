import type { InfluencerTimelineEventRow } from "@/lib/influencers/timeline-repository";

export function InfluencerTimeline({
  events,
}: {
  events: InfluencerTimelineEventRow[];
}) {
  return (
    <section className="form-panel elevated-panel section-gap">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Historico</p>
          <h2>Timeline operacional</h2>
        </div>
        <span className="panel-chip">{events.length} eventos</span>
      </div>
      {events.length === 0 ? (
        <div className="empty-state">
          <strong>Nenhum evento registrado</strong>
          <p>Alteracoes de perfil, status, observacoes e arquivamento aparecerao aqui.</p>
        </div>
      ) : (
        <div className="timeline-list">
          {events.map((event) => (
            <article className="timeline-item" key={event.id}>
              <div>
                <strong>{event.title}</strong>
                {event.description ? <p>{event.description}</p> : null}
              </div>
              <span>
                {new Intl.DateTimeFormat("pt-BR", {
                  dateStyle: "short",
                  timeStyle: "short",
                }).format(event.created_at)}
              </span>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
