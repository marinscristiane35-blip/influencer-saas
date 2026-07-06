import Link from "next/link";
import { findInfluencerByCompany } from "@/lib/influencers/repository";
import { findInfluencerCommissionDetail } from "@/lib/orders/repository";
import { requireCompanyPermission } from "@/lib/tenant/context";

function money(value: string | number | null | undefined) {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency",
  }).format(Number(value ?? 0));
}

export default async function CommissionDetailPage({
  params,
}: {
  params: Promise<{ commissionId: string; id: string }>;
}) {
  const [{ commissionId, id }, tenant] = await Promise.all([
    params,
    requireCompanyPermission("finance:view_sensitive"),
  ]);
  const influencer = await findInfluencerByCompany({
    companyId: tenant.companyId,
    influencerId: id,
  });

  if (!influencer) {
    return (
      <section className="form-panel elevated-panel">
        <p className="eyebrow">Comissao</p>
        <h2>Influenciador nao encontrado</h2>
        <Link className="text-link" href="/dashboard/influenciadores">
          Voltar
        </Link>
      </section>
    );
  }

  const detail = await findInfluencerCommissionDetail({
    commissionId,
    companyId: tenant.companyId,
    influencerId: influencer.id,
  });

  if (!detail) {
    return (
      <section className="form-panel elevated-panel">
        <p className="eyebrow">Comissao</p>
        <h2>Comissao nao encontrada</h2>
        <p className="muted">
          Este evento nao existe ou nao pertence ao tenant atual.
        </p>
        <Link
          className="text-link"
          href={`/dashboard/influenciadores/${influencer.id}`}
        >
          Voltar para o perfil
        </Link>
      </section>
    );
  }

  return (
    <>
      <section className="profile-hero">
        <div>
          <Link
            className="text-link"
            href={`/dashboard/influenciadores/${influencer.id}`}
          >
            Voltar
          </Link>
          <p className="eyebrow">Detalhe da comissao</p>
          <h2>Pedido {detail.external_id}</h2>
          <p className="muted">{influencer.name}</p>
        </div>
        <span className="status-badge status-draft">
          {detail.commission_status}
        </span>
      </section>

      <section className="metric-grid section-gap">
        <article className="metric-card">
          <p>Valor do pedido</p>
          <div className="metric">{money(detail.gross_amount)}</div>
          <span>{detail.customer_email ?? "Cliente nao informado"}</span>
        </article>
        <article className="metric-card">
          <p>Percentual</p>
          <div className="metric">
            {detail.commission_rate ? `${detail.commission_rate}%` : "-"}
          </div>
          <span>Taxa aplicada ao evento.</span>
        </article>
        <article className="metric-card">
          <p>Comissao</p>
          <div className="metric">{money(detail.commission_amount)}</div>
          <span>Valor gerado para a carteira.</span>
        </article>
      </section>

      <section className="form-panel elevated-panel section-gap">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Origem</p>
            <h2>Pedido, cupom e ledger</h2>
          </div>
          <span className="panel-chip">{detail.coupon_code ?? "Sem cupom"}</span>
        </div>
        <div className="detail-grid">
          <span>Pedido externo</span>
          <strong>{detail.external_id}</strong>
          <span>Fonte</span>
          <strong>{detail.commission_source_type}</strong>
          <span>Data do pedido</span>
          <strong>
            {new Intl.DateTimeFormat("pt-BR").format(detail.ordered_at)}
          </strong>
          <span>Base de calculo</span>
          <strong>{money(detail.commission_base_amount)}</strong>
          <span>Status da comissao</span>
          <strong>{detail.commission_status}</strong>
          <span>Disponivel em</span>
          <strong>
            {detail.commission_available_at
              ? new Intl.DateTimeFormat("pt-BR").format(
                  detail.commission_available_at,
                )
              : "-"}
          </strong>
        </div>
      </section>
    </>
  );
}
