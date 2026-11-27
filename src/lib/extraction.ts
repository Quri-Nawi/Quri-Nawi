export const extractionFields = {
  title: "Título", authors: "Autoría", matrix: "Matriz", species: "Especie", place: "Lugar", method: "Método", sampled: "Fechas de muestreo", published: "Fecha de publicación",
} as const;
export type Field = keyof typeof extractionFields;
export type Page = { page: number; text: string };
export type Support = { page: number; section: string; quote: string };
export type Suggestion = { field: Field; value: string | null; evidence: Support | null };
export type Decision = { action: "pending" | "accept" | "correct" | "reject"; value: string; reason: string; support: Support | null };
export type Extraction = {
  method: "reglas-locales-v1";
  source: string;
  sha256: string;
  pages: number;
  reviewer: string;
  reviewed: string;
  fields: { suggestion: Suggestion; decision: Decision; value: string | null }[];
};
export const extractionLimits = "Reglas locales, sin IA generativa ni OCR. La autoría puede quedar incompleta y una matriz sugerida no excluye otras. No infiere especies ni permisos. Página = índice del PDF, no numeración impresa. Requiere revisión humana; no publica.";
export const normalizeText = (text: string) => text.replace(/-\s*\n\s*/g, "").replace(/\s+/g, " ").trim();
const keys = Object.keys(extractionFields) as Field[];

/** Piloto acotado: reconoce metadatos rotulados y algunos patrones del informe CEDIB. */
export function suggestFields(pages: readonly Page[]): Suggestion[] {
  const find = (field: Field, pattern: RegExp, map: (match: RegExpMatchArray) => string = m => m[1] ?? m[0], lines = false): Suggestion | null => {
    for (const page of pages) {
      const text = lines ? page.text : normalizeText(page.text);
      const match = text.match(pattern);
      if (match) return { field, value: map(match).trim().slice(0, 500), evidence: { page: page.page, section: `Página PDF ${page.page}`, quote: normalizeText(match[0]).slice(0, 500) } };
    }
    return null;
  };
  const rules: { [K in Field]: () => Suggestion | null } = {
    title: () => find("title", /MERCURIO Y SALUD EN LA AMAZON[IÍ]A BOLIVIANA/i) ?? find("title", /T[íi]tulo:\s*([^\n]+)/i, m => m[1], true),
    authors: () => find("authors", /Autor(?:es|[íi]a):\s*([^\n]+)/i, m => m[1], true),
    matrix: () => find("matrix", /Obtenci[óo]n de muestras de (cabello)/i, m => m[1].toLowerCase()) ?? find("matrix", /muestras de (cabello|sedimentos?|agua|peces)/i, m => m[1].toLowerCase()),
    species: () => find("species", /Especie:\s*([^\n]+)/i, m => m[1], true),
    place: () => find("place", /(?:r[íi]os|cuencas de los r[íi]os) (Beni y Madre de Dios)/i),
    method: () => find("method", /Analizador Directo de Mercurio Lumex RA-915M/i),
    sampled: () => find("sampled", /desarrollado durante (20\d{2}) y (20\d{2})/i, m => `${m[1]}–${m[2]}`),
    published: () => find("published", /Primera Edici[óo]n:\s*([a-záéíóú]+ de 20\d{2})/i),
  };
  return keys.map(field => rules[field]() ?? { field, value: null, evidence: null });
}
export function reviewExtraction(input: { source: string; sha256: string; pages: readonly Page[]; reviewer: string; suggestions: readonly Suggestion[]; decisions: { [K in Field]: Decision } }): Extraction {
  const url = new URL(input.source);
  if (url.protocol !== "https:" || url.username || url.password || !/^[a-f0-9]{64}$/.test(input.sha256) || !input.reviewer.trim() || input.reviewer.length > 120) throw new Error("Indica fuente HTTPS y nombre de la persona que corrige.");
  if (input.suggestions.length !== keys.length || new Set(input.suggestions.map(s => s.field)).size !== keys.length || !input.suggestions.every(s => keys.includes(s.field))) throw new Error("Faltan campos de la extracción.");
  const backed = (support: Support | null) => support && Number.isInteger(support.page) && support.section.trim() && support.quote.trim() && support.quote.length <= 500 && input.pages.some(p => p.page === support.page && normalizeText(p.text).includes(normalizeText(support.quote)));
  const fields = input.suggestions.map(suggestion => {
    const decision = input.decisions[suggestion.field];
    if (!decision || !["accept", "correct", "reject"].includes(decision.action)) throw new Error("Revisa todos los campos, incluidos los desconocidos.");
    if (suggestion.value !== null && (!suggestion.value.trim() || !backed(suggestion.evidence))) throw new Error("La sugerencia debe conservar su respaldo en el documento.");
    if (suggestion.value === null && suggestion.evidence !== null) throw new Error("Un campo ausente no tiene respaldo inventado.");
    if (["correct", "reject"].includes(decision.action) && (!decision.reason.trim() || decision.reason.length > 500)) throw new Error("Registra el motivo de cada corrección o rechazo.");
    if (decision.action === "correct" && (!decision.value.trim() || decision.value.length > 500 || !backed(decision.support))) throw new Error("La corrección requiere valor, página y un fragmento literal del documento (máximo 500 caracteres).");
    return { suggestion, decision, value: decision.action === "reject" ? null : decision.action === "correct" ? decision.value.trim() : suggestion.value };
  });
  if (!fields.find(f => f.suggestion.field === "title")?.value) throw new Error("El título necesita aceptación o corrección.");
  return { method: "reglas-locales-v1", source: url.href, sha256: input.sha256, pages: input.pages.length, reviewer: input.reviewer.trim(), reviewed: new Date().toISOString(), fields };
}
