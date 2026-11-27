const method = [
  { title: "Recopilar", meta: "Fuente / enlace", text: "Guardar la fuente y distinguir el momento de muestreo del año de publicación.", visual: <span className="viz-stagger" aria-hidden="true">{[0, 1, 2, 3, 4].map((i) => <i key={i} style={{ ["--d" as string]: i }} />)}</span> },
  { title: "Revisar", meta: "Método / matriz / unidad", text: "Cotejar método, matriz, lugar y unidad. Un dato con información incompleta conserva ese estado.", visual: <svg className="viz-wave" viewBox="0 0 160 60" aria-hidden="true"><line x1="0" y1="30" x2="160" y2="30" /><line x1="40" y1="4" x2="40" y2="56" /><circle cx="40" cy="30" r="14" /><path d="M0 30 C 20 4, 40 4, 60 30 S 100 56, 120 30 S 150 8, 160 18" /><circle className="viz-runner" r="3.5" /></svg> },
  { title: "Publicar", meta: "Borrador / revisión / pública", text: "Compartir registros autorizados y conservar la referencia que permite comprobar cada dato.", visual: <span className="viz-sequence" aria-hidden="true"><b>Borrador</b><b>Revisión</b><b>Pública</b></span> },
];

export function ProjectSections() {
  return <>
    <section className="section-inner method anchor-section" id="metodo" aria-labelledby="method-title">
      <div className="section-head"><div><p className="eyebrow">Método</p><h2 id="method-title">Cada dato tiene un origen.</h2></div><p>El catálogo conserva las referencias y los límites de cada observación para que puedas volver al documento.</p></div>
      <ol className="toolkit-grid">{method.map((step, index) => <li key={step.title} className="tool-card">
        <p className="tool-meta"><span>{step.meta}</span><span>{String(index + 1).padStart(2, "0")}</span></p>
        <h3>{step.title}</h3>
        <div className="tool-visual">{step.visual}</div>
        <p>{step.text}</p>
      </li>)}</ol>
    </section>
    <div className="insight">
      <div className="section-inner insight-inner">
        <section className="anchor-section" id="impacto" aria-labelledby="impact-title">
          <p className="eyebrow">Impacto</p>
          <h2 id="impact-title">Qué vale la pena medir después.</h2>
          <p>El piloto busca reducir el tiempo para encontrar una fuente y detectar vacíos en el catálogo. La exposición y la salud requieren evidencia específica y revisión especializada.</p>
          <a className="text-link" href="#comparar">Ver el caso de sedimentos del Kaka ↗</a>
        </section>
        <section className="agent-panel anchor-section" id="agentes" aria-labelledby="agent-title">
          <p className="eyebrow">Agentes e interoperabilidad</p>
          <h2 id="agent-title">El mismo catálogo, en JSON.</h2>
          <p>Consulta los registros públicos y sus fuentes. El MCP de Jhamil es un servicio separado. La conexión con este catálogo requiere conservar los mismos identificadores, fuentes y estados.</p>
          <div className="basin-actions"><a className="button outline" href="/api/catalogo" target="_blank" rel="noreferrer">Abrir catálogo JSON ↗</a><a className="button outline" href="/api/fuentes" target="_blank" rel="noreferrer">Fuentes y cifras JSON ↗</a></div>
        </section>
      </div>
    </div>
    <section className="section-inner method anchor-section" id="escala" aria-labelledby="scale-title">
      <div className="section-head"><div><p className="eyebrow">Escala</p><h2 id="scale-title">Del piloto a más cuencas.</h2></div><p>La expansión depende de fichas comprobables, permisos y un flujo de revisión que otra institución pueda usar.</p></div>
      <ol className="method-list">
        <li><h3>Beni y Kaka</h3><p>Probar con usuarios si encuentran la fuente y pueden explicar qué dato falta. Aún no hay prueba con usuarios: es el primer paso del plan (docs/viabilidad.md).</p></li>
        <li><h3>Revisión institucional</h3><p>Asignar revisores, registrar el historial y definir quién publica y quién mantiene el catálogo.</p></li>
        <li><h3>Nuevos territorios</h3><p>Incorporar estudios de otras cuencas y permitir que los agentes lean las fichas autorizadas.</p></li>
      </ol>
    </section>
  </>;
}
