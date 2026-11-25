"use client";

import { useEffect, useState, type FormEvent } from "react";

type Draft = { title: string; url: string; territory: string };
const key = "quri-nawi:proposals:v1";
// Borradores guardados antes del cambio de nombre; se leen si aún no hay borradores con la clave nueva.
const previousKey = "curinawi:proposals:v1";

function isDraft(item: unknown): item is Draft {
  if (typeof item !== "object" || item === null) return false;
  const value = item as Partial<Draft>;
  return typeof value.title === "string" && typeof value.url === "string" && typeof value.territory === "string";
}

export function Contribution() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [feedback, setFeedback] = useState("");

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
    const form = event.currentTarget;
    const data = new FormData(form);
    const title = String(data.get("title") ?? "").trim();
    const territory = String(data.get("territory") ?? "");
    let url: URL;
    try {
      const source = String(data.get("source") ?? "").trim();
      url = new URL(/^10\.\d+\//.test(source) ? "https://doi.org/" + source : source);
      if (url.protocol !== "https:") throw new Error("HTTPS");
    } catch {
      setFeedback("Ingresa un DOI o un enlace público que empiece con https://.");
      return;
    }
    if (!title || !territory) {
      setFeedback("Completa el título y el territorio.");
      return;
    }
    if (drafts.some((item) => item.url === url.href && item.territory === territory)) {
      setFeedback("Ya guardaste una propuesta con esa fuente para este territorio.");
      return;
    }
    if (persist([...drafts, { title, url: url.href, territory }], "Borrador guardado en este dispositivo. Pendiente de revisión.")) form.reset();
  }

  return (
    <section className="section-inner contribute anchor-section" id="aportar" aria-labelledby="contribution-title">
      <div>
        <p className="eyebrow">Ampliar el catálogo</p>
        <h2 id="contribution-title">Aporta un estudio.</h2>
        <p>Guarda la referencia que quieres proponer. Esta primera versión conserva el borrador en tu navegador. Una ficha requiere revisión y autorización antes de publicarse.</p>
      </div>
      <div className="contribution-panel">
        <form onSubmit={submit}>
          <label>Título del estudio<input name="title" placeholder="Ej. Mercurio en sedimentos del río…" maxLength={150} required /></label>
          <label>DOI o enlace de la fuente<input name="source" placeholder="Pega el enlace" maxLength={500} required /></label>
          <label>Territorio<select name="territory" defaultValue="" required><option value="" disabled>Selecciona</option><option>Beni</option><option>Kaka</option><option>Madre de Dios</option><option>Otro</option></select></label>
          <button className="button primary" type="submit">Guardar borrador <span aria-hidden="true">↗</span></button>
        </form>
        <p className="form-feedback" role="status">{feedback}</p>
        {drafts.length > 0 && <ul className="drafts">
          {drafts.map((draft, index) => <li key={draft.url + draft.territory}>
            <div><strong>{draft.title}</strong><span>{draft.territory} · Borrador local</span></div>
            <button className="text-button" type="button" aria-label={"Quitar borrador " + draft.title} onClick={() => persist(drafts.filter((_, item) => item !== index), "Borrador quitado.")}>Quitar</button>
          </li>)}
        </ul>}
      </div>
    </section>
  );
}
