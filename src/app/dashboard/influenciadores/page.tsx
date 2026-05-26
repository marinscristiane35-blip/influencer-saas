import { getTenant } from "@/lib/tenant/context";
import { listInfluencersByCompany } from "@/lib/influencers/repository";
import { InfluencerForm } from "@/components/influencer-form";

const statusLabels = {
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

export default async function InfluencersPage() {
  const tenant = await getTenant();

  if (!tenant) {
    return null;
  }

  const influencers = await listInfluencersByCompany(tenant.companyId);

  return (
    <>
      <section className="page-heading compact-heading">
        <p className="eyebrow">Influenciadores</p>
        <h2>Base de criadores da empresa</h2>
        <p className="muted">
          Cadastre perfis, mantenha cupons organizados e acompanhe o status de
          cada relacionamento dentro do tenant atual.
        </p>
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

      <section className="form-panel elevated-panel list-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Base da empresa</p>
            <h2>Influenciadores</h2>
          </div>
          <span className="panel-chip">{influencers.length} cadastrados</span>
        </div>
        {influencers.length === 0 ? (
          <div className="empty-state">
            <strong>Nenhum influenciador cadastrado ainda</strong>
            <p>
              Adicione o primeiro perfil para comecar a formar a base comercial
              da empresa. O cadastro ja fica isolado neste tenant.
            </p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Contato</th>
                  <th>Instagram</th>
                  <th>Cupom</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {influencers.map((influencer) => (
                  <tr key={influencer.id}>
                    <td>
                      <strong>{influencer.name}</strong>
                      {influencer.notes ? (
                        <span className="table-note">{influencer.notes}</span>
                      ) : null}
                    </td>
                    <td>
                      <span>{influencer.email}</span>
                      {influencer.phone ? (
                        <span className="table-note">{influencer.phone}</span>
                      ) : null}
                    </td>
                    <td>
                      {influencer.instagram ? `@${influencer.instagram}` : "-"}
                    </td>
                    <td>{influencer.coupon_code ?? "-"}</td>
                    <td>
                      <span className={statusClasses[influencer.status]}>
                        {statusLabels[influencer.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      </div>
    </>
  );
}
