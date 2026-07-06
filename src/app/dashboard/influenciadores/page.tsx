import Link from "next/link";
import { requireCompanyPermission } from "@/lib/tenant/context";
import { listInfluencerOperationalSummaries } from "@/lib/influencers/repository";
import { InfluencerForm } from "@/components/influencer-form";

const statusLabels = {
  all: "Todos",
  active: "Ativo",
  invited: "Convidado",
  paused: "Pausado",
  declined: "Recusado",
} as const;

const statusClasses = {
  active: "status-badge status-active",
  invited: "status-badge status-invited",
  paused: "status-badge status-paused",
  declined: "status-badge status-declined",
} as const;

const statusOptions = [
  { label: "Todos", value: "all" },
  { label: "Ativos", value: "active" },
  { label: "Convidados", value: "invited" },
  { label: "Pausados", value: "paused" },
  { label: "Recusados", value: "declined" },
] as const;

function money(value: string | number | null | undefined) {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency",
  }).format(Number(value ?? 0));
}

function shortDate(value: Date | null | undefined) {
  if (!value) {
    return "Sem movimento";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(value);
}

function parseStatus(value?: string) {
  if (
    value === "active" ||
    value === "invited" ||
    value === "paused" ||
    value === "declined"
  ) {
    return value;
  }

  return null;
}

export default async function InfluencersPage({
  searchParams,
}: {
  searchParams: Promise<{ archived?: string; q?: string; status?: string }>;
}) {
  const tenant = await requireCompanyPermission("influencers:view");
  const { archived, q, status } = await searchParams;
  const includeArchived = archived === "1";
  const selectedStatus = parseStatus(status);
  const search = q?.trim() ?? "";
  const canViewFinance = tenant.can("finance:view_sensitive");

  const influencers = await listInfluencerOperationalSummaries({
    companyId: tenant.companyId,
    includeArchived,
    search,
    status: selectedStatus,
  });
  const activeCount = influencers.filter(
    (influencer) => influencer.status === "active" && !influencer.archived_at,
  ).length;
  const archivedCount = influencers.filter(
    (influencer) => influencer.archived_at,
  ).length;
  const currentMonthCommission = influencers.reduce(
    (total, influencer) =>
      total + Number(influencer.current_month_commission ?? 0),
    0,
  );
  const currentMonthOrders = influencers.reduce(
    (total, influencer) =>
      total + Number(influencer.current_month_orders_count ?? 0),
    0,
  );
  const currentMonthSold = influencers.reduce(
    (total, influencer) =>
      total + Number(influencer.current_month_sold_amount ?? 0),
    0,
  );
  const rankedInfluencers = [...influencers].sort((left, right) => {
    const leftRank = Number(left.ranking_position ?? 999999);
    const rightRank = Number(right.ranking_position ?? 999999);

    if (leftRank !== rightRank) {
      return leftRank - rightRank;
    }

    return (
      Number(right.current_month_sold_amount ?? 0) -
      Number(left.current_month_sold_amount ?? 0)
    );
  });

  function filterHref(next: {
    archived?: boolean;
    status?: string | null;
    q?: string | null;
  }) {
    const params = new URLSearchParams();
    const nextArchived = next.archived ?? includeArchived;
    const nextStatus = next.status === undefined ? selectedStatus : next.status;
    const nextSearch = next.q === undefined ? search : next.q;

    if (nextArchived) {
      params.set("archived", "1");
    }

    if (nextStatus && nextStatus !== "all") {
      params.set("status", nextStatus);
    }

    if (nextSearch) {
      params.set("q", nextSearch);
    }

    const query = params.toString();
    return query ? `/dashboard/influenciadores?${query}` : "/dashboard/influenciadores";
  }

  return (
    <>
      <section className="page-heading compact-heading">
        <p className="eyebrow">Influenciadores</p>
        <h2>Painel operacional de influenciadores</h2>
        <p className="muted">
          Acompanhe ranking mensal, cupons, vendas, comissoes e acesso ao
          portal antes de abrir o perfil individual.
        </p>
      </section>

      <section className="metric-grid section-gap">
        <article className="metric-card">
          <p>Total exibido</p>
          <div className="metric">{influencers.length}</div>
          <span>Base exibida com os filtros atuais.</span>
        </article>
        <article className="metric-card">
          <p>Ativos</p>
          <div className="metric">{activeCount}</div>
          <span>Perfis prontos para operacao.</span>
        </article>
        <article className="metric-card">
          <p>Pedidos do mes</p>
          <div className="metric">{currentMonthOrders}</div>
          <span>Pedidos pagos com cupons da base exibida.</span>
        </article>
        <article className="metric-card">
          <p>Vendido no mes</p>
          <div className="metric">
            {canViewFinance ? money(currentMonthSold) : "Restrito"}
          </div>
          <span>Valor comissionavel importado no mes.</span>
        </article>
        <article className="metric-card">
          <p>Comissao do mes</p>
          <div className="metric">
            {canViewFinance ? money(currentMonthCommission) : "Restrito"}
          </div>
          <span>Comissoes geradas por cupom.</span>
        </article>
        <article className="metric-card">
          <p>Arquivados</p>
          <div className="metric">{archivedCount}</div>
          <span>{includeArchived ? "Incluidos na visao." : "Ocultos por padrao."}</span>
        </article>
      </section>

      <section className="list-toolbar elevated-panel section-gap">
        <form className="search-form" action="/dashboard/influenciadores">
          {includeArchived ? (
            <input name="archived" type="hidden" value="1" />
          ) : null}
          {selectedStatus ? (
            <input name="status" type="hidden" value={selectedStatus} />
          ) : null}
          <label className="field" htmlFor="influencer-search">
            <span>Busca operacional</span>
            <input
              defaultValue={search}
              id="influencer-search"
              name="q"
              placeholder="Nome, e-mail ou cupom"
              type="search"
            />
          </label>
          <button className="button primary-action" type="submit">
            Buscar
          </button>
          {search ? (
            <Link className="filter-chip" href={filterHref({ q: null })}>
              Limpar busca
            </Link>
          ) : null}
        </form>

        <div className="filter-row">
          {statusOptions.map((option) => (
            <Link
              className={
                (selectedStatus ?? "all") === option.value
                  ? "filter-chip active"
                  : "filter-chip"
              }
              href={filterHref({ status: option.value })}
              key={option.value}
            >
              {option.label}
            </Link>
          ))}
          <Link
            className={includeArchived ? "filter-chip active" : "filter-chip"}
            href={filterHref({ archived: !includeArchived })}
          >
            {includeArchived ? "Arquivados incluidos" : "Incluir arquivados"}
          </Link>
        </div>
      </section>

      <div className="influencers-layout">
        <section className="form-panel elevated-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">{tenant.company.name}</p>
              <h2>Novo influenciador</h2>
            </div>
            <span className="panel-chip">Tenant</span>
          </div>
          <InfluencerForm />
        </section>

        <section className="form-panel elevated-panel list-panel operational-list-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Base da empresa</p>
              <h2>Influenciadores</h2>
            </div>
            <span className="panel-chip">{influencers.length} exibidos</span>
          </div>
          {influencers.length === 0 ? (
            <div className="empty-state">
              <strong>Nenhum influenciador encontrado</strong>
              <p>
                Ajuste os filtros ou cadastre um novo perfil para iniciar a
                operacao da empresa.
              </p>
            </div>
          ) : (
            <div className="influencer-card-list">
              {rankedInfluencers.map((influencer, index) => (
                <article
                  className={
                    influencer.archived_at
                      ? "influencer-row-card archived"
                      : "influencer-row-card"
                  }
                  key={influencer.id}
                >
                  <div className="influencer-row-main">
                    <div className="ranking-identity">
                      <div className="ranking-position">
                        {influencer.ranking_position
                          ? `#${influencer.ranking_position.toString()}`
                          : `#${index + 1}`}
                      </div>
                      <div>
                      <div className="row-title">
                        <strong>{influencer.name}</strong>
                        <span className={statusClasses[influencer.status]}>
                          {statusLabels[influencer.status]}
                        </span>
                        {influencer.archived_at ? (
                          <span className="status-badge status-declined">
                            Arquivado
                          </span>
                        ) : null}
                      </div>
                      <span className="table-note">{influencer.email}</span>
                      <span className="table-note">
                        {influencer.instagram
                          ? `@${influencer.instagram}`
                          : "Instagram nao informado"}
                        {influencer.phone ? ` - ${influencer.phone}` : ""}
                      </span>
                      <span className="table-note">
                        Portal:{" "}
                        {influencer.portal_account_status === "active"
                          ? "ativo"
                          : influencer.portal_account_status === "inactive"
                            ? "inativo"
                            : "sem acesso"}
                      </span>
                      </div>
                    </div>
                    <Link
                      className="button secondary-button row-profile-link"
                      href={`/dashboard/influenciadores/${influencer.id}`}
                    >
                      Abrir perfil
                    </Link>
                  </div>

                  <div className="influencer-row-metrics">
                    <div>
                      <span>Cupom</span>
                      <strong>
                        {influencer.coupon_code ?? "Sem cupom"}
                      </strong>
                    </div>
                    <div>
                      <span>Pedidos do mes</span>
                      <strong>{influencer.current_month_orders_count.toString()}</strong>
                      <small>
                        {Number(influencer.current_month_orders_count) === 0
                          ? "Sem vendas no mes"
                          : "Pedidos pagos"}
                      </small>
                    </div>
                    <div>
                      <span>Vendido no mes</span>
                      <strong>
                        {canViewFinance
                          ? money(influencer.current_month_sold_amount)
                          : "Restrito"}
                      </strong>
                    </div>
                    <div>
                      <span>Comissao do mes</span>
                      <strong>
                        {canViewFinance
                          ? money(influencer.current_month_commission)
                          : "Restrito"}
                      </strong>
                    </div>
                    <div>
                      <span>Saldo</span>
                      <strong>
                        {canViewFinance
                          ? money(influencer.available_balance)
                          : "Restrito"}
                      </strong>
                      {canViewFinance ? (
                        <small>Pendente {money(influencer.pending_balance)}</small>
                      ) : null}
                    </div>
                    <div>
                      <span>Ultimo movimento</span>
                      <strong>{influencer.last_movement_title ?? "Sem historico"}</strong>
                      <small>{shortDate(influencer.last_movement_at)}</small>
                    </div>
                  </div>

                  {influencer.notes ? (
                    <p className="row-note">{influencer.notes}</p>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
