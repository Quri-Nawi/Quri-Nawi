import type { Record as Study } from "./catalog";

export type Publication = {
  proposalId: string;
  state: "publicado";
  version: number;
  record: Study;
  metadata: { authors: string; section: string; method: string; species: string; analyte: string };
  permission: { public: true; basis: string; precision: "generalizada"; expires: string | null };
  review: { reviewer: string; date: string; decision: "aprobar"; reason: string; scientific: "pendiente" | "completada" };
  history: { version: number; date: string; reviewer: string; reason: string }[];
};
const text = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;
const https = (v: unknown) => { try { const u = new URL(String(v)); return u.protocol === "https:" && !u.username && !u.password; } catch { return false; } };
const date = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && Number.isFinite(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v;

/** El proceso por PR revisa la identidad del firmante. Escribir un nombre en JSON no es autenticación. */
export function validatePublication(value: unknown): asserts value is Publication {
  if (!value || typeof value !== "object") throw new Error("Falta expediente de publicación.");
  const p = value as Publication;
  const r = p.record;
  const only = (obj: object, keys: string[]) => Object.keys(obj).every(key => keys.includes(key));
  if (!only(p, ["proposalId", "state", "version", "record", "metadata", "permission", "review", "history"])) throw new Error("El expediente contiene campos no públicos.");
  if (!r || !/^p_[a-f0-9]{20}$/.test(p.proposalId) || p.state !== "publicado" || !Number.isInteger(p.version) || p.version < 1) throw new Error("Falta ID de cola, versión o estado publicado.");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(r.id) || !["Beni", "Kaka", "Madre de Dios"].includes(r.area) || !["Sedimentos", "Peces", "Datos agregados", "Proyecto"].includes(r.matrix)) throw new Error("Ficha, matriz o territorio inválido.");
  for (const field of ["title", "sample", "published", "source", "note", "precision"] as const) if (!text(r[field])) throw new Error(`Falta ${field}. Usa Desconocido si no consta.`);
  if (!https(r.url) || !date(r.checked) || !["primaria", "secundaria", "parcial", "sin-verificar"].includes(r.verification) || !["Revisión por pares", "Informe técnico", "Prensa especializada", "Sitio oficial"].includes(r.evidenceType)) throw new Error("Fuente, fecha o verificación inválida.");
  for (const field of ["claims", "limits", "sourceIds"] as const) if (!Array.isArray(r[field]) || !r[field].length || !r[field].every(text)) throw new Error(`Falta respaldo: ${field}.`);
  if (!Array.isArray(r.places) || !r.places.every(place => text(place.name) && Number.isFinite(place.lon) && Math.abs(place.lon) <= 180 && Number.isFinite(place.lat) && Math.abs(place.lat) <= 90)) throw new Error("Ubicación inválida.");
  if (r.observation && ![r.observation.value, r.observation.unit, r.observation.season].every(text)) throw new Error("Observación incompleta.");
  if (r.measures && !["ambiente", "peces", "personas"].includes(r.measures)) throw new Error("Medición inválida.");
  for (const field of ["authors", "section", "method", "species", "analyte"] as const) if (!text(p.metadata?.[field])) throw new Error(`Falta metadato ${field}.`);
  if (p.permission?.public !== true || !text(p.permission.basis) || p.permission.precision !== "generalizada" || !(p.permission.expires === null || date(p.permission.expires))) throw new Error("Falta autorización pública y precisión generalizada.");
  if (!text(p.review?.reviewer) || !date(p.review.date) || p.review.decision !== "aprobar" || !text(p.review.reason) || !["pendiente", "completada"].includes(p.review.scientific)) throw new Error("Falta revisión humana atribuida y motivada.");
  if (!Array.isArray(p.history) || p.history.length !== p.version || !p.history.every((h, i) => h.version === i + 1 && date(h.date) && text(h.reviewer) && text(h.reason))) throw new Error("Historial incompleto o versión no consecutiva.");
  const last = p.history.at(-1)!;
  if (last.reviewer !== p.review.reviewer || last.date !== p.review.date || last.reason !== p.review.reason) throw new Error("La revisión no coincide con el último cambio.");
  if (!only(p.metadata, ["authors", "section", "method", "species", "analyte"]) || !only(p.permission, ["public", "basis", "precision", "expires"]) || !only(p.review, ["reviewer", "date", "decision", "reason", "scientific"]) || p.history.some(h => !only(h, ["version", "date", "reviewer", "reason"])) || (r.observation && !only(r.observation, ["value", "unit", "season"]))) throw new Error("Metadatos con campos no públicos.");
  // Lista cerrada: ni el expediente original ni campos privados arbitrarios alcanzan la salida pública.
  const allowed = ["id", "title", "area", "matrix", "sample", "published", "source", "url", "note", "observation", "verification", "evidenceType", "checked", "claims", "limits", "sourceIds", "precision", "places", "measures"];
  if (Object.keys(r).some(key => !allowed.includes(key)) || r.places.some(place => Object.keys(place).some(key => !["name", "lon", "lat"].includes(key)))) throw new Error("La ficha contiene campos ajenos a la proyección pública.");
}
export function publicPublications(values: readonly unknown[], today = new Date().toISOString().slice(0, 10)): Publication[] {
  return values.flatMap(value => {
    try {
      validatePublication(value);
      return value.permission.expires !== null && value.permission.expires < today ? [] : [value];
    } catch { return []; }
  });
}
