"use client";

import { useState, type FormEvent } from "react";
import { extractionFields, extractionLimits, reviewExtraction, suggestFields, type Decision, type Extraction, type Field, type Page, type Suggestion } from "../lib/extraction";

const fields = Object.keys(extractionFields) as Field[];
const blank = (): { [K in Field]: Decision } => Object.fromEntries(fields.map(field => [field, { action: "pending", value: "", reason: "", support: null }])) as { [K in Field]: Decision };

export function ExtractionForm({ onSave }: { onSave: (extraction: Extraction, territory: string) => boolean }) {
  const [pages, setPages] = useState<Page[]>([]);
  const [sha256, setSha256] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [decisions, setDecisions] = useState(blank);
  const [selected, setSelected] = useState<Field>("title");
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  const suggestion = suggestions.find(item => item.field === selected);
  const decision = decisions[selected];

  function change(patch: Partial<Decision>) { setDecisions(current => ({ ...current, [selected]: { ...current[selected], ...patch } })); }
  async function load(file: File | undefined) {
    if (!file || busy) return;
    setBusy(true); setFeedback(""); setPages([]); setSuggestions([]); setDecisions(blank());
    try {
      const { readDocument } = await import("../lib/read-document");
      const result = await readDocument(file);
      const suggested = suggestFields(result.pages);
      setPages(result.pages); setSha256(result.sha256); setSuggestions(suggested); setSelected("title"); setPage(suggested[0].evidence?.page ?? 1);
      setFeedback("Lectura terminada. Revisa los ocho campos; los ausentes están marcados como desconocidos.");
    } catch (error) { setFeedback(error instanceof Error ? error.message : "No se pudo leer el archivo."); }
    finally { setBusy(false); }
  }
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      if (data.get("publicMetadata") !== "on") throw new Error("Confirma que solo guardarás metadatos públicos autorizados.");
      const extraction = reviewExtraction({ source: String(data.get("source")), sha256, pages, reviewer: String(data.get("reviewer")), suggestions, decisions });
      if (onSave(extraction, String(data.get("territory")))) setFeedback("Propuesta pendiente guardada. Descarga su expediente en la lista de borradores; la revisión local no publica una ficha.");
      else setFeedback("No se guardó la extracción. Revisa si ya existe esa fuente/territorio o si el navegador tiene espacio.");
    } catch (error) { setFeedback(error instanceof Error ? error.message : "Revisión incompleta."); }
  }

  return <details className="extraction">
    <summary>Importar informe y revisar sugerencias</summary>
    <p>Piloto: informe CEDIB «Mercurio y salud en la Amazonia boliviana». También admite texto rotulado. El archivo se procesa en este navegador y no se sube al servidor.</p>
    <p><a href="https://www.cedib.org/wp-content/uploads/2026/08/MERCURIO-Y-SALUD-EN-LA-AMAZONIA-BOLIVIANA-.pdf" target="_blank" rel="noreferrer">Abrir informe de demostración ↗</a> · Descárgalo desde CEDIB y selecciónalo aquí.</p>
    <p>PDF con texto o TXT UTF-8; 8 MiB, 200 páginas, un millón de caracteres y 30 segundos como máximo. TXT: separa páginas con salto de página. {extractionLimits}</p>
    <label>Informe autorizado<input type="file" accept=".pdf,.txt,application/pdf,text/plain" disabled={busy} onChange={event => { load(event.target.files?.[0]); event.target.value = ""; }} /></label>
    <p role="status" className="extraction-feedback">{busy ? "Leyendo el documento…" : feedback}</p>
    {suggestions.length > 0 && <form className="extraction-review" onSubmit={save}>
      <label>Fuente pública HTTPS<input type="url" name="source" required maxLength={500} placeholder="https://…" /></label>
      <label>Persona que revisa<input name="reviewer" required maxLength={120} /></label>
      <label>Territorio del aporte<select name="territory" required defaultValue=""><option value="" disabled>Selecciona</option><option>Beni</option><option>Kaka</option><option>Madre de Dios</option><option>Otro</option></select></label>
      <p>Elige el territorio de esta propuesta; no atribuyas a toda la cuenca una medición local. El archivo tiene {pages.length} páginas. Huella SHA-256: <small className="document-hash">{sha256}</small></p>
      <div className="extraction-fields" role="group" aria-label="Campos por revisar">{fields.map(field => <button key={field} type="button" aria-pressed={selected === field} onClick={() => { setSelected(field); setPage(suggestions.find(s => s.field === field)?.evidence?.page ?? page); }}>{extractionFields[field]} · {decisions[field].action === "pending" ? "pendiente" : "revisado"}</button>)}</div>
      <div className="extraction-columns">
        <div>
          <label>Página del documento<input type="number" min={1} max={pages.length} value={page} onChange={event => setPage(Math.max(1, Math.min(pages.length, Number(event.target.value) || 1)))} /></label>
          <pre aria-label="Texto de la fuente">{pages.find(p => p.page === page)?.text || "Esta página no contiene texto extraíble."}</pre>
        </div>
        <div className="extraction-decision">
          <h3>{extractionFields[selected]}</h3>
          <p>Sugerencia: <strong>{suggestion?.value ?? "Desconocido"}</strong></p>
          {suggestion?.evidence && <blockquote><p>{suggestion.evidence.quote}</p><cite>{suggestion.evidence.section}</cite></blockquote>}
          <label>Decisión<select value={decision.action} onChange={event => change({ action: event.target.value as Decision["action"], value: decision.value || suggestion?.value || "", support: decision.support ?? suggestion?.evidence ?? { page, section: `Página PDF ${page}`, quote: "" } })}><option value="pending">Pendiente</option><option value="accept">Aceptar{suggestion?.value ? " sugerencia" : " como desconocido"}</option><option value="correct">Corregir con respaldo</option><option value="reject">Rechazar sugerencia</option></select></label>
          {decision.action === "correct" && <>
            <label>Valor corregido<input value={decision.value} maxLength={500} onChange={event => change({ value: event.target.value })} /></label>
            <label>Página de respaldo<input type="number" min={1} max={pages.length} value={decision.support?.page ?? page} onChange={event => change({ support: { page: Number(event.target.value), section: decision.support?.section ?? "", quote: decision.support?.quote ?? "" } })} /></label>
            <label>Sección de respaldo<input value={decision.support?.section ?? ""} maxLength={150} onChange={event => change({ support: { page: decision.support?.page ?? page, section: event.target.value, quote: decision.support?.quote ?? "" } })} /></label>
            <label>Fragmento literal de respaldo<textarea value={decision.support?.quote ?? ""} maxLength={500} onChange={event => change({ support: { page: decision.support?.page ?? page, section: decision.support?.section ?? "", quote: event.target.value } })} /></label>
          </>}
          {["correct", "reject"].includes(decision.action) && <label>Motivo de la decisión<textarea value={decision.reason} maxLength={500} onChange={event => change({ reason: event.target.value })} /></label>}
        </div>
      </div>
      <label className="extraction-permission"><input type="checkbox" name="publicMetadata" required /> Confirmo que el expediente contiene solo metadatos públicos autorizados, sin datos personales ni ubicaciones restringidas. Esta declaración no sustituye la autorización de publicación.</label>
      <button className="button primary" type="submit">Guardar propuesta pendiente</button>
    </form>}
  </details>;
}
