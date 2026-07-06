import Link from "next/link";
import type { ReactNode } from "react";

export function PageHero({
  actions,
  eyebrow,
  metric,
  subtitle,
  title,
}: {
  actions?: ReactNode;
  eyebrow: string;
  metric?: {
    detail: string;
    label: string;
    value: ReactNode;
  };
  subtitle: string;
  title: string;
}) {
  return (
    <section className="product-hero">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        <p>{subtitle}</p>
        {actions ? <div className="hero-action-row">{actions}</div> : null}
      </div>
      {metric ? (
        <article className="hero-highlight-card">
          <span>{metric.label}</span>
          <strong>{metric.value}</strong>
          <p>{metric.detail}</p>
        </article>
      ) : null}
    </section>
  );
}

export function MetricCard({
  detail,
  label,
  tone = "default",
  value,
}: {
  detail: string;
  label: string;
  tone?: "accent" | "default";
  value: ReactNode;
}) {
  return (
    <article className={tone === "accent" ? "metric-card metric-card-accent" : "metric-card"}>
      <p>{label}</p>
      <div className="metric">{value}</div>
      <span>{detail}</span>
    </article>
  );
}

export function ActionCard({
  detail,
  href,
  label,
}: {
  detail: string;
  href: string;
  label: string;
}) {
  return (
    <Link className="action-card" href={href}>
      <strong>{label}</strong>
      <span>{detail}</span>
    </Link>
  );
}
