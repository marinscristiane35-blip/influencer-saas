import Link from "next/link";
import { listInfluencerCoupons } from "@/lib/financial/repository";
import { listInfluencersByCompany } from "@/lib/influencers/repository";
import { requireCompanyPermission } from "@/lib/tenant/context";

const statusLabels = {
  active: "Ativo",
  inactive: "Inativo",
} as const;

const statusClasses = {
  active: "status-badge status-active",
  inactive: "status-badge status-paused",
} as const;

function formatDate(value: Date | null) {
  return value ? new Intl.DateTimeFormat("pt-BR").format(value) : "-";
}

export default async function DashboardCouponsPage() {
  const tenant = await requireCompanyPermission("influencers:view");
  const [coupons, influencers] = await Promise.all([
    listInfluencerCoupons({ companyId: tenant.companyId }),
    listInfluencersByCompany(tenant.companyId),
  ]);
  const influencersById = new Map(
    influencers.map((influencer) => [influencer.id, influencer]),
  );
  const activeCoupons = coupons.filter((coupon) => coupon.status === "active");

  return (
    <>
      <section className="page-heading compact-heading">
        <p className="eyebrow">Cupons</p>
        <h2>Cupons dos influenciadores</h2>
        <p className="muted">
          Consulte os codigos vinculados aos influenciadores desta empresa. A
          criacao e atualizacao continuam no cadastro/perfil do influenciador.
        </p>
      </section>

      <section className="metric-grid section-gap">
        <article className="metric-card">
          <p>Total de cupons</p>
          <div className="metric">{coupons.length}</div>
          <span>Codigos cadastrados neste tenant.</span>
        </article>
        <article className="metric-card">
          <p>Ativos</p>
          <div className="metric">{activeCoupons.length}</div>
          <span>Disponiveis para matching de pedidos.</span>
        </article>
        <article className="metric-card">
          <p>Influenciadores</p>
          <div className="metric">{influencers.length}</div>
          <span>Base atual da empresa.</span>
        </article>
      </section>

      <section className="form-panel elevated-panel list-panel section-gap">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Base da empresa</p>
            <h2>Codigos vinculados</h2>
          </div>
          <span className="panel-chip">{coupons.length} cupons</span>
        </div>
        {coupons.length === 0 ? (
          <div className="empty-state">
            <strong>Nenhum cupom cadastrado ainda</strong>
            <p>
              Cadastre ou atualize o cupom no perfil de um influenciador para
              que os pedidos importados possam gerar comissoes.
            </p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Cupom</th>
                  <th>Influenciador</th>
                  <th>Status</th>
                  <th>Inicio</th>
                  <th>Fim</th>
                  <th>Perfil</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((coupon) => {
                  const influencer = influencersById.get(coupon.influencer_id);

                  return (
                    <tr key={coupon.id}>
                      <td>
                        <strong>{coupon.code}</strong>
                      </td>
                      <td>
                        <strong>{influencer?.name ?? "Influenciador removido"}</strong>
                        {influencer ? (
                          <span className="table-note">{influencer.email}</span>
                        ) : null}
                      </td>
                      <td>
                        <span className={statusClasses[coupon.status]}>
                          {statusLabels[coupon.status]}
                        </span>
                      </td>
                      <td>{formatDate(coupon.starts_at)}</td>
                      <td>{formatDate(coupon.ends_at)}</td>
                      <td>
                        {influencer ? (
                          <Link
                            className="text-link"
                            href={`/dashboard/influenciadores/${influencer.id}`}
                          >
                            Abrir perfil
                          </Link>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
