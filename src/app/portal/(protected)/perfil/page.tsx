import { requireInfluencer } from "@/lib/auth/guards";

export default async function PortalProfilePage() {
  const context = await requireInfluencer();

  return (
    <section className="form-panel elevated-panel">
      <p className="eyebrow">Perfil</p>
      <h2>{context.influencer.name}</h2>
      <p>
        <strong>E-mail:</strong> {context.influencer.email}
      </p>
      <p>
        <strong>Instagram:</strong>{" "}
        {context.influencer.instagram ? `@${context.influencer.instagram}` : "-"}
      </p>
      <p>
        <strong>Cupom:</strong> {context.influencer.coupon_code ?? "-"}
      </p>
      <p>
        <strong>Empresa:</strong> {context.companyName}
      </p>
    </section>
  );
}
