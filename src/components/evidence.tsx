import { records, verificationLabel, type Verification } from "../lib/catalog";
import { checkedOn, figureStatusLabel, figures, summarize, type FigureStatus } from "../lib/evidence";

const chip: { readonly [K in FigureStatus]: string } = {
  VERIFICADA_PRIMARIA: "primaria",
  VERIFICADA_SECUNDARIA: "secundaria",
  PARCIAL: "parcial",
  NO_VERIFICADA: "sin-verificar",
  CONFLICTO: "conflicto",
  PROPIO_SUPUESTO: "sin-verificar",
  DEMO: "sin-verificar",
  ADVERTENCIA: "conflicto",
};
const folder = "https://github.com/Quri-Nawi/Quri-Nawi/tree/main/docs/fuentes";
const dateFormat = new Intl.DateTimeFormat("es-BO", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export function Evidence() {
  const total = summarize();
  const levels = (Object.keys(verificationLabel) as Verification[])
    .map((level) => ({ level, count: records.filter((record) => record.verification === level).length }))
    .filter(({ count }) => count > 0);

  return (
    <section className="section-inner evidence anchor-section" id="respaldo" aria-labelledby="evidence-title">
      <div className="section-head">
        <div><p className="eyebrow">Respaldo</p><h2 id="evidence-title">Qué decimos y con qué respaldo.</h2></div>
        <p>El registro documental distingue respaldo, advertencias y supuestos. La revisión de la fuente no equivale a validar científicamente sus conclusiones. Las cifras con respaldo parcial o con conflicto se dicen con sus límites.</p>
      </div>
      <ul className="evidence-stats">
        <li><strong>{records.length}</strong><span>fichas, cada una con sus límites a la vista</span></li>
        <li><strong>{total.sources}</strong><span>fuentes con enlace o DOI</span></li>
        <li><strong>{total.figures}</strong><span>cifras con estado de verificación</span></li>
        <li><strong>{dateFormat.format(new Date(checkedOn))}</strong><span>fecha de revisión documental registrada</span></li>
      </ul>
      <p className="evidence-levels">
        {levels.map(({ level, count }) => <span key={level}><span className={"verif verif-" + level}>{verificationLabel[level]}</span> {count}</span>)}
      </p>
      <details className="figure-table">
        <summary>Ver las {total.figures} cifras y cómo decirlas</summary>
        <div className="table-scroll">
          <table>
            <thead><tr><th scope="col">Cifra</th><th scope="col">Cómo decirla</th><th scope="col">Estado</th></tr></thead>
            <tbody>
              {figures.map((figure) => <tr key={figure.id}>
                <th scope="row">{figure.figure}<small>{figure.id} · {figure.sources}</small></th>
                <td>{figure.safeWording}</td>
                <td><span className={"verif verif-" + chip[figure.status]}>{figureStatusLabel[figure.status]}</span></td>
              </tr>)}
            </tbody>
          </table>
        </div>
      </details>
      <div className="basin-actions evidence-links">
        <a className="button outline" href="/api/fuentes" target="_blank" rel="noreferrer">Abrir fuentes y cifras en JSON ↗</a>
        <a className="button outline" href={folder} target="_blank" rel="noreferrer">Ver la carpeta de respaldo ↗</a>
      </div>
    </section>
  );
}
