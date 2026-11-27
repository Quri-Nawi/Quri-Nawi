const method = [
  ["Recopilar", "Guardar la fuente y distinguir el momento de muestreo del año de publicación."],
  ["Revisar", "Cotejar método, matriz, lugar y unidad. Un dato con información incompleta conserva ese estado."],
  ["Publicar", "Compartir registros autorizados y conservar la referencia que permite comprobar cada dato."],
];

export function ProjectSections() {
  return <>
    <section className="section-inner method anchor-section" id="metodo" aria-labelledby="method-title">
      <div className="section-head"><div><p className="eyebrow">Método</p><h2 id="method-title">Cada dato tiene un origen.</h2></div><p>El catálogo conserva las referencias y los límites de cada observación para que puedas volver al documento.</p></div>
      <ol className="method-list">{method.map(([title, description]) => <li key={title}><h3>{title}</h3><p>{description}</p></li>)}</ol>
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
