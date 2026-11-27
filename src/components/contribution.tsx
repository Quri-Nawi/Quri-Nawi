"use client";

import { useEffect, useState, type FormEvent } from "react";

import { ExtractionForm } from "./extraction";
import { extractionLimits, type Extraction } from "../lib/extraction";
import { parseDraft, sourceUrl, type Draft, type Receipt } from "../lib/proposals";
const key = "quri-nawi:proposals:v1";
// Borradores guardados antes del cambio de nombre; se leen si aún no hay borradores con la clave nueva.
const previousKey = "curinawi:proposals:v1";

function isDraft(item: unknown): item is Draft {
  if (typeof item !== "object" || item === null) return false;
  const value = item as Partial<Draft>;
  try { parseDraft(value); return true; } catch { return false; }
}

export function Contribution() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [feedback, setFeedback] = useState("");
  const [sending, setSending] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem(key) ?? localStorage.getItem(previousKey) ?? "[]");
      if (Array.isArray(saved)) setDrafts(saved.filter(isDraft));
    } catch {
      setFeedback("No se pudieron recuperar los borradores de este navegador.");
    }
  }, []);

  function persist(next: Draft[], message: string) {
    try {
      localStorage.setItem(key, JSON.stringify(next));
      setDrafts(next);
      setFeedback(message);
      return true;
    } catch {
      setFeedback("El navegador no pudo guardar el cambio. Comprueba el almacenamiento local.");
      return false;
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const title = String(data.get("title") ?? "").trim();
    const territory = String(data.get("territory") ?? "");
    let url: string;
    try {
      const source = String(data.get("source") ?? "").trim();
      url = sourceUrl(source);
    } catch {
      setFeedback("Ingresa un DOI o un enlace público que empiece con https://.");
      return;
    }
    if (!title || !territory) {
      setFeedback("Completa el título y el territorio.");
      return;
    }
    if (drafts.some((item) => sourceUrl(item.url) === url && item.territory === territory)) {
      setFeedback("Ya guardaste una propuesta con esa fuente para este territorio.");
      return;
    }
    if (persist([...drafts, { title, url, territory }], "Borrador guardado en este dispositivo. Pendiente de revisión.")) form.reset();
  }

  async function send(draft: Draft) {
    if (sending) return;
    setSending(draft.url);
    try {
      const response = await fetch("/api/propuestas", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parseDraft(draft)) });
      const answer = await response.json();
      if (!response.ok) throw new Error(answer.error ?? "No se confirmó el envío.");
      const receipt = answer as Receipt;
      if (!/^p_[a-f0-9]{20}$/.test(receipt.id) || !["pendiente_revision", "aceptada", "rechazada"].includes(receipt.estado)) throw new Error("Respuesta de cola inválida; conserva el borrador.");
      persist(drafts.map(item => item.url === draft.url && item.territory === draft.territory ? { ...item, receipt } : item), `${receipt.duplicado ? "Ya estaba registrada" : "Referencia registrada"}: ${receipt.id} · ${receipt.estado}. La revisión no implica publicación.`);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Sin conexión. Conserva el borrador y reintenta.");
    } finally { setSending(null); }
  }

  function saveExtraction(extraction: Extraction, territory: string) {
    if (sending) return false;
    const title = extraction.fields.find(field => field.suggestion.field === "title")?.value ?? "";
    const draft = { ...parseDraft({ title, url: extraction.source, territory }), extraction };
    const exists = drafts.find(item => sourceUrl(item.url) === draft.url && item.territory === territory);
    return persist(exists ? drafts.map(item => item === exists ? { ...draft, receipt: exists.receipt } : item) : [...drafts, draft], "Extracción revisada guardada como propuesta pendiente en este dispositivo.");
  }

  function download(draft: Draft) {
    const envelope = { schema: "quri-propuesta-v1", state: "pendiente_revision", created: new Date().toISOString(), draft: parseDraft(draft), queue: draft.receipt ?? null, extraction: draft.extraction ?? null, extractionLimits: draft.extraction ? extractionLimits : null, review: null };
    const url = URL.createObjectURL(new Blob([JSON.stringify(envelope, null, 2)], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = "quri-propuesta.json"; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <section className="section-inner contribute anchor-section" id="aportar" aria-labelledby="contribution-title">
      <div>
        <p className="eyebrow">Ampliar el catálogo</p>
        <h2 id="contribution-title">Aporta un estudio.</h2>
        <p>Guarda la referencia que quieres proponer. El borrador queda en tu navegador. Puedes enviar su referencia a la cola privada y descargar el expediente para revisión por PR. Una ficha requiere revisión y autorización antes de publicarse.</p>
      </div>
      <div className="contribution-panel">
        <ExtractionForm onSave={saveExtraction} />
        <form onSubmit={submit}>
          <label>Título del estudio<input name="title" placeholder="Ej. Mercurio en sedimentos del río…" maxLength={150} required /></label>
          <label>DOI o enlace de la fuente<input name="source" placeholder="Pega el enlace" maxLength={500} required /></label>
          <label>Territorio<select name="territory" defaultValue="" required><option value="" disabled>Selecciona</option><option>Beni</option><option>Kaka</option><option>Madre de Dios</option><option>Otro</option></select></label>
          <button disabled={sending !== null} className="button primary" type="submit">Guardar borrador <span aria-hidden="true">↗</span></button>
        </form>
        <p className="form-feedback" role="status">{feedback}</p>
        {drafts.length > 0 && <ul className="drafts">
          {drafts.map((draft, index) => <li key={draft.url + draft.territory}>
            <div><strong>{draft.title}</strong><span>{draft.territory} · {draft.receipt ? `${draft.receipt.id} · ${draft.receipt.estado}` : "Borrador local"}</span></div>
            <button className="text-button" type="button" disabled={sending !== null || Boolean(draft.receipt)} onClick={() => send(draft)}>{sending === draft.url ? "Enviando…" : draft.receipt ? "Referencia registrada" : "Enviar a revisión"}</button>
            <button className="text-button" type="button" onClick={() => download(draft)}>Descargar expediente</button>
            <button disabled={sending !== null} className="text-button" type="button" aria-label={"Quitar borrador " + draft.title} onClick={() => persist(drafts.filter((_, item) => item !== index), "Borrador quitado.")}>Quitar</button>
          </li>)}
        </ul>}
      </div>
    </section>
  );
}
