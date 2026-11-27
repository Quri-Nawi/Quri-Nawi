import type { Record } from "./catalog";

/**
 * Escenario «si nadie vuelve a medir»: no proyecta niveles de mercurio.
 * Calcula cuántos años tendrá el dato más reciente de cada río en un año dado, con las fichas del catálogo.
 */
export const outlookYears = [2026, 2027, 2028, 2029, 2030] as const;
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

// Color continuo por antigüedad: verde (0 años) → ámbar (5) → naranja (10) → rojo (20 o más); gris si no hay datos.
const stops: readonly [number, number][] = [[0, 0x6ee7a0], [5, 0xffd36b], [10, 0xff8a3d], [20, 0xff3b30]];
export function ageColor(age: number | null) {
  if (age === null) return 0x9a93b5;
  const i = stops.findIndex(([at]) => at >= age);
  if (i === -1) return stops[stops.length - 1][1];
  if (i === 0) return stops[0][1];
  const [a, ca] = stops[i - 1], [b, cb] = stops[i];
  const t = (age - a) / (b - a);
  const mix = (shift: number) => Math.round(((ca >> shift) & 255) * (1 - t) + ((cb >> shift) & 255) * t) << shift;
  return mix(16) | mix(8) | mix(0);
}
export const cssColor = (color: number) => "#" + color.toString(16).padStart(6, "0");

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
