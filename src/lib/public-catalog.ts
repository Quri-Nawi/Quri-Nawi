import { catalogVersion, records, type Record as Study } from "./catalog";
import { checkedOn, sources } from "./evidence";

export type CatalogRecord = Study & { version: string; publicationStatus: "pendiente_revision_mcp" };
export type SourceLinks = { readonly [id: string]: { readonly title: string; readonly url: string } };
export type CatalogSnapshot = {
  records: readonly CatalogRecord[];
  sourceLinks: SourceLinks;
  version: string;
  checked: string;
  consultedAt: string | null;
  copy: "online" | "offline" | "included";
};

export const includedSnapshot: CatalogSnapshot = {
  records: records.map((record) => ({ ...record, version: catalogVersion, publicationStatus: "pendiente_revision_mcp" })),
  sourceLinks: Object.fromEntries(sources.map(({ id, title, url }) => [id, { title, url }])),
  version: catalogVersion,
  checked: checkedOn,
  consultedAt: null,
  copy: "included",
};

function object(value: unknown): value is { [key: string]: unknown } {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function strings(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string" && item.length > 0);
}

function validRecord(value: unknown): value is CatalogRecord {
  if (!object(value) || !object(value.observation) && value.observation !== undefined) return false;
  const fields = ["id", "title", "area", "matrix", "sample", "published", "source", "url", "note", "verification", "evidenceType", "checked", "precision", "version"];
  if (!fields.every((key) => typeof value[key] === "string" && (value[key] as string).length > 0)) return false;
  if (value.publicationStatus !== "pendiente_revision_mcp" || !strings(value.claims) || !value.claims.length || !strings(value.limits) || !value.limits.length || !strings(value.sourceIds) || !value.sourceIds.length) return false;
  if (!Array.isArray(value.places) || !value.places.every((place) => object(place) && typeof place.name === "string" && typeof place.lon === "number" && Number.isFinite(place.lon) && typeof place.lat === "number" && Number.isFinite(place.lat))) return false;
  try { return new URL(value.url as string).protocol === "https:"; } catch { return false; }
}

export async function loadPublicCatalog(signal: AbortSignal): Promise<CatalogSnapshot> {
  const [catalogResponse, sourcesResponse] = await Promise.all([
    fetch("/api/catalogo", { signal }),
    fetch("/api/fuentes", { signal }),
  ]);
  if (!catalogResponse.ok || !sourcesResponse.ok) throw new Error("No se pudo consultar el catálogo y sus fuentes.");
  const catalog: unknown = await catalogResponse.json();
  const evidence: unknown = await sourcesResponse.json();
  if (!object(catalog) || !object(evidence) || !object(catalog.provenance) || !object(evidence.provenance)) throw new Error("Formato de catálogo inválido.");
  if (catalog.provenance.kind !== "semillas_pendientes_mcp" || evidence.provenance.kind !== "respaldo_documental") throw new Error("Procedencia de catálogo inválida.");
  if (typeof catalog.version !== "string" || catalog.version !== evidence.version || typeof catalog.checked !== "string" || typeof catalog.consultedAt !== "string" || Number.isNaN(Date.parse(catalog.consultedAt))) throw new Error("Versiones o fecha de catálogo inválidas.");
  if (!Array.isArray(catalog.records) || !catalog.records.every(validRecord) || !Array.isArray(evidence.sources)) throw new Error("Fichas o fuentes inválidas.");
  const links: { [id: string]: { title: string; url: string } } = {};
  for (const source of evidence.sources) {
    if (!object(source) || typeof source.id !== "string" || typeof source.title !== "string" || typeof source.url !== "string") throw new Error("Fuente inválida.");
    try { if (new URL(source.url).protocol !== "https:") throw new Error(); } catch { throw new Error("URL de fuente inválida."); }
    if (links[source.id]) throw new Error("ID de fuente duplicado.");
    links[source.id] = { title: source.title, url: source.url };
  }
  const ids = new Set<string>();
  for (const record of catalog.records) {
    if (ids.has(record.id) || record.version !== catalog.version || record.sourceIds.some((id) => !links[id])) throw new Error("IDs o referencias del catálogo inválidos.");
    ids.add(record.id);
  }
  return {
    records: catalog.records,
    sourceLinks: links,
    version: catalog.version,
    checked: catalog.checked,
    consultedAt: catalog.consultedAt,
    copy: catalogResponse.headers.get("X-Quri-Copy") === "offline" || sourcesResponse.headers.get("X-Quri-Copy") === "offline" ? "offline" : "online",
  };
}
