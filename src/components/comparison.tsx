import { verificationLabel } from "../lib/catalog";
import type { CatalogRecord } from "../lib/public-catalog";

export function Comparison({ selected, onClear }: { selected: readonly CatalogRecord[]; onClear: () => void }) {
  const [first, second] = selected;
  const kakaPair = first?.id.startsWith("kaka-") && second?.id.startsWith("kaka-");
  const mixedTypes = first && second && first.evidenceType !== second.evidenceType;

  return (
    <section className="comparison anchor-section" id="comparar" aria-labelledby="compare-title">
      <div className="section-inner compare-inner">
        <div className="section-head compare-heading">
          <div><p className="eyebrow">Lectura comparada</p><h2 id="compare-title">Dos registros,<br />sus límites a la vista.</h2></div>
          <p>Compara la fecha, el tipo de muestra, la unidad, el nivel de verificación y la fuente antes de interpretar la diferencia.</p>
        </div>
        <div className="compare-grid">
          {[first, second].map((record, index) => (
            <div className="compare-slot" key={index}>
              {record ? <>
                <p className="eyebrow">{record.area} · {record.matrix}</p>
                <p className="record-meta">{record.id} · v{record.version} · pendiente de autorización MCP</p>
                {record.observation ? <div className="measurement">{record.observation.value}<span> {record.observation.unit}</span></div> : <h3>{record.title}</h3>}
                <p>{record.observation?.season ?? record.matrix} · Muestreo {record.sample}</p>
                <p className="compare-status"><span className={"verif verif-" + record.verification}>{verificationLabel[record.verification]}</span> {record.evidenceType}</p>
                <p className="compare-limit">Límite: {record.limits[0]}</p>
                <a href={record.url} target="_blank" rel="noreferrer">Ver fuente ↗</a>
              </> : <p>Elige una ficha del catálogo para completar este lado.</p>}
            </div>
          ))}
        </div>
        <p className="compare-note" aria-live="polite">
          {kakaPair ? "Comparación descriptiva. Ambas observaciones son de 1998 y proceden de la misma revisión. Faltan el método y el punto exacto para interpretar la diferencia."
            : selected.length === 2 ? "Lectura lado a lado. Comprueba que el lugar, el tipo de muestra y el método sean comparables antes de combinar los resultados."
              + (mixedTypes ? ` Las fuentes son de tipos distintos (${first.evidenceType.toLowerCase()} y ${second.evidenceType.toLowerCase()}): compara también su nivel de verificación y sus límites.` : "")
              : "Puedes seleccionar hasta dos fichas desde el catálogo."}
        </p>
        <div className="compare-actions"><a href="#explorar">Volver al catálogo ↑</a><button type="button" onClick={onClear} disabled={selected.length === 0}>Limpiar selección</button></div>
      </div>
    </section>
  );
}
