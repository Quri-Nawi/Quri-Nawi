// Valida que el catálogo, el registro de fuentes y la matriz de cifras sean coherentes entre sí.
// Uso: npm run datos   (Node 24 lee los .ts directamente)
import { readFileSync } from "node:fs";
import { records } from "../src/lib/catalog.ts";
import { checkedOn, figureStatusLabel, figures, sources, summarize } from "../src/lib/evidence.ts";
import { ageColor, riverOutlook, sampleYear } from "../src/lib/outlook.ts";

const fallos = [];
const comprobar = (condicion, mensaje) => { if (!condicion) fallos.push(mensaje); };
const unicos = (lista) => new Set(lista).size === lista.length;

// 1. Identificadores únicos y bien formados
comprobar(unicos(sources.map((s) => s.id)), "Hay IDs de fuente repetidos.");
comprobar(unicos(figures.map((f) => f.id)), "Hay IDs de cifra repetidos.");
comprobar(unicos(records.map((r) => r.id)), "Hay IDs de ficha repetidos.");
sources.forEach((s, i) => comprobar(s.id === "S" + String(i + 1).padStart(2, "0"), `La fuente ${s.id} rompe la numeración correlativa (esperada S${String(i + 1).padStart(2, "0")}).`));

// 2. Cada fuente tiene título, fecha de comprobación y enlace https o DOI
const ids = new Set(sources.map((s) => s.id));
for (const s of sources) {
  comprobar(s.title.trim().length > 0, `${s.id}: sin título.`);
  comprobar(s.checked.trim().length > 0, `${s.id}: no dice cómo se comprobó.`);
  if (s.url) { try { comprobar(new URL(s.url).protocol === "https:", `${s.id}: la URL no es https.`); } catch { fallos.push(`${s.id}: URL inválida.`); } }
  comprobar(Boolean(s.url) || Boolean(s.doi), `${s.id}: sin URL ni DOI.`);
}

// 3. Cada ficha apunta a fuentes existentes y declara qué comprobó y qué no
const permitidas = new Set(Object.keys({ primaria: 1, secundaria: 1, parcial: 1, "sin-verificar": 1 }));
for (const r of records) {
  comprobar(permitidas.has(r.verification), `${r.id}: nivel de verificación desconocido.`);
  comprobar(r.sourceIds.length > 0, `${r.id}: sin fuentes.`);
  comprobar(r.claims.length > 0, `${r.id}: no dice qué se comprobó.`);
  comprobar(r.limits.length > 0, `${r.id}: no declara límites.`);
  comprobar(/^\d{4}-\d{2}-\d{2}$/.test(r.checked), `${r.id}: fecha de comprobación inválida.`);
  r.sourceIds.forEach((id) => comprobar(ids.has(id), `${r.id}: cita ${id}, que no existe en el registro.`));
  comprobar(new URL(r.url).protocol === "https:", `${r.id}: la URL principal no es https.`);
  comprobar(sources.some((s) => s.url === r.url || s.moreUrls.includes(r.url)), `${r.id}: su URL principal no figura en el registro de fuentes.`);
  if (r.verification === "primaria") comprobar(r.sourceIds.some((id) => sources.find((s) => s.id === id)?.kind !== "Prensa"), `${r.id}: marcada primaria sin una fuente que no sea prensa.`);
}

// 4. Cada cifra cita fuentes existentes y tiene redacción segura; los conflictos dicen cuál es el conflicto
for (const f of figures) {
  comprobar(f.status in figureStatusLabel, `${f.id}: estado desconocido (${f.status}).`);
  comprobar(f.safeWording.trim().length > 0, `${f.id}: sin redacción segura.`);
  const citadas = f.sources.match(/S\d{2}/g) ?? [];
  const sinFuente = ["NO_VERIFICADA", "PROPIO_SUPUESTO", "DEMO", "ADVERTENCIA"].includes(f.status);
  if (!sinFuente) comprobar(citadas.length > 0 || f.sources.includes("/"), `${f.id}: cifra verificada sin fuente ni archivo citado.`);
  citadas.forEach((id) => comprobar(ids.has(id), `${f.id}: cita ${id}, que no existe en el registro.`));
  if (f.status === "CONFLICTO") comprobar(f.note.trim().length > 0, `${f.id}: conflicto sin explicación.`);
}

// 5. Los CSV de docs/fuentes dicen lo mismo que los datos que usa la aplicación
function leerCsv(ruta) {
  const texto = readFileSync(ruta, "utf8").replace(/^\uFEFF/, "");
  const filas = [];
  let fila = [], campo = "", entre = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (entre) {
      if (c === '"' && texto[i + 1] === '"') { campo += '"'; i++; } else if (c === '"') entre = false; else campo += c;
    } else if (c === '"') entre = true;
    else if (c === ",") { fila.push(campo); campo = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && texto[i + 1] === "\n") i++; fila.push(campo); campo = ""; if (fila.some(Boolean)) filas.push(fila); fila = []; }
    else campo += c;
  }
  if (campo || fila.length) { fila.push(campo); filas.push(fila); }
  const [cabecera, ...datos] = filas;
  return datos.map((d) => Object.fromEntries(cabecera.map((k, i) => [k, d[i] ?? ""])));
}
const csvFuentes = leerCsv("docs/fuentes/REGISTRO_FUENTES.csv");
const csvCifras = leerCsv("docs/fuentes/MATRIZ_CIFRAS.csv");
comprobar(csvFuentes.length === sources.length, "REGISTRO_FUENTES.csv no tiene el mismo número de fuentes que src/lib/evidence.ts.");
comprobar(csvCifras.length === figures.length, "MATRIZ_CIFRAS.csv no tiene el mismo número de cifras que src/lib/evidence.ts.");
for (const fuente of sources) {
  const fila = csvFuentes.find((r) => r.id === fuente.id);
  if (!fila) { fallos.push(`${fuente.id}: no está en REGISTRO_FUENTES.csv.`); continue; }
  comprobar(fila.titulo === fuente.title, `${fuente.id}: el título difiere entre el CSV y la app.`);
  comprobar(fila.url === [fuente.url, ...fuente.moreUrls].join(" ; "), `${fuente.id}: la URL difiere entre el CSV y la app.`);
}
for (const cifra of figures) {
  const fila = csvCifras.find((r) => r.id === cifra.id);
  if (!fila) { fallos.push(`${cifra.id}: no está en MATRIZ_CIFRAS.csv.`); continue; }
  comprobar(fila.estado === cifra.status, `${cifra.id}: el estado difiere entre el CSV y la app.`);
  comprobar(fila.redaccion_segura === cifra.safeWording, `${cifra.id}: la redacción segura difiere entre el CSV y la app.`);
  comprobar(fila.valor_publicable === cifra.value, `${cifra.id}: el valor difiere entre el CSV y la app.`);
}

comprobar(summarize().figures === figures.length && summarize().sources === sources.length, "summarize() no coincide con los datos.");

// Escenario de antigüedad del dato: lectura de años y casos conocidos del catálogo
comprobar(sampleYear("Jul–ago 2015") === 2015 && sampleYear("Estudios de 1997 a 2024") === 2024 && sampleYear("No indicada en la reseña") === null, "sampleYear no lee bien los años de muestreo.");
const kaka2050 = riverOutlook(records, "Kaka", 2050);
comprobar(kaka2050.newest === 1998 && kaka2050.age === 52 && kaka2050.level === "critico", "El escenario del Kaka en 2050 debería dar 52 años y nivel crítico.");
comprobar(riverOutlook(records, "Mamoré", 2026).level === "sin-datos", "Un río sin fichas debería quedar sin datos.");
comprobar(ageColor(0) === 0x6ee7a0 && ageColor(25) === 0xff3b30 && ageColor(null) === 0x9a93b5 && ageColor(3) !== ageColor(4), "ageColor no recorre la escala verde, ámbar, naranja y rojo.");
comprobar(riverOutlook(records, "Kaka", 2030).age === 32 && riverOutlook(records, "Beni", 2027).age === 3, "Antigüedad del Kaka en 2030 o del Beni en 2027 inesperada.");
comprobar(records.filter((r) => r.measures).every((r) => r.matrix !== "Proyecto"), "Una ficha de proyecto no puede contar como medición.");

if (fallos.length) {
  console.error(`Datos inconsistentes (${fallos.length}):\n- ` + fallos.join("\n- "));
  process.exit(1);
}
const verif = Object.groupBy(records, (r) => r.verification);
console.log(`Datos coherentes: ${records.length} fichas (${Object.entries(verif).map(([k, v]) => `${k} ${v.length}`).join(", ")}), ${sources.length} fuentes, ${figures.length} cifras, comprobado el ${checkedOn}.`);
