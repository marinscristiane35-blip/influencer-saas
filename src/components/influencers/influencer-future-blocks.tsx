const blocks = [
  {
    detail: "Vinculos entre campanhas e influenciadores entrarao aqui.",
    label: "Campanhas",
  },
  {
    detail: "Pontuacao, regras e participacao serao exibidas neste bloco.",
    label: "Desafios",
  },
  {
    detail: "Envios, aprovacoes e entregas aparecerao quando o modulo existir.",
    label: "Conteudos/entregas",
  },
];

export function InfluencerFutureBlocks() {
  return (
    <section className="metric-grid section-gap">
      {blocks.map((block) => (
        <article className="metric-card" key={block.label}>
          <p>{block.label}</p>
          <div className="metric">0</div>
          <span>{block.detail}</span>
        </article>
      ))}
    </section>
  );
}
