import type { Record } from "./catalog";

/**
 * Escenario «si nadie vuelve a medir»: no proyecta niveles de mercurio.
 * Calcula cuántos años tendrá el dato más reciente de cada río en un año dado, con las fichas del catálogo.
 */
export const outlookYears = [2026, 2030, 2050] as const;
export type OutlookYear = (typeof outlookYears)[number];
export type Level = "reciente" | "envejece" | "antiguo" | "critico" | "sin-datos";

export const lines = [
  { key: "ambiente", label: "agua y sedimentos", ods: [6, 15] },
  { key: "peces", label: "peces", ods: [15] },
  { key: "personas", label: "personas", ods: [3] },
] as const;

// Criterio del equipo para priorizar, no un umbral científico.
export const levelLabel: { readonly [K in Level]: string } = {
  reciente: "Hasta 5 años",
  envejece: "6 a 10 años",
  antiguo: "11 a 20 años",
  critico: "Más de 20 años",
  "sin-datos": "Sin datos en el catálogo",
};

export function sampleYear(sample: string) {
  const years = sample.match(/\b(19|20)\d{2}\b/g);
  return years ? Math.max(...years.map(Number)) : null;
}

export function riverOutlook(records: readonly Record[], river: string, year: number) {
  const own = records.filter((record) => record.area === river && record.measures);
  const latest = lines.map((line) => {
    const found = own.filter((record) => record.measures === line.key).map((record) => sampleYear(record.sample)).filter((value) => value !== null);
    return { ...line, year: found.length ? Math.max(...found) : null };
  });
  const known = latest.map((line) => line.year).filter((value) => value !== null);
  const newest = known.length ? Math.max(...known) : null;
  const age = newest === null ? null : year - newest;
  const level: Level = age === null ? "sin-datos" : age <= 5 ? "reciente" : age <= 10 ? "envejece" : age <= 20 ? "antiguo" : "critico";
  return { river, newest, age, level, latest, missing: latest.filter((line) => line.year === null).map((line) => line.label) };
}
