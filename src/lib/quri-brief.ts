import { records, verificationLabel } from "./catalog";
import { outlookYears } from "./outlook";

/** Ríos que la maqueta 3D sabe enfocar (mismos nombres que public/geo/rios.json). */
export const quriRivers = ["Kaka", "Beni", "Madre de Dios", "Alto Beni", "Mamoré", "Tuichi", "Coroico", "Orthon", "Mapiri"] as const;

/** Herramientas con las que Quri mueve el mapa; el navegador las ejecuta y devuelve el resultado. */
export const quriTools = [
  {
    type: "function",
    name: "enfocar_rio",
    description: "Acerca la maqueta 3D a un río y muestra sus fichas. Devuelve las fichas de ese río para explicarlas.",
    parameters: { type: "object", properties: { rio: { type: "string", enum: [...quriRivers] } }, required: ["rio"] },
  },
  {
    type: "function",
    name: "ver_escenario",
    description: "Cambia el mapa al escenario «si nadie vuelve a medir» en un año, o al mapa de hoy con anio 0.",
    parameters: { type: "object", properties: { anio: { type: "integer", enum: [0, ...outlookYears] } }, required: ["anio"] },
  },
  {
    type: "function",
    name: "volver_a_la_cuenca",
    description: "Aleja la cámara y vuelve a la vista general de la cuenca.",
    parameters: { type: "object", properties: {} },
  },
] as const;

/** Fichas de un río en forma breve, para que Quri hable solo con lo que el catálogo respalda. */
export function riverFacts(river: string) {
  return records.filter((record) => record.area === river).map((record) => ({
    titulo: record.title,
    tipo: record.matrix,
    valor: record.observation ? `${record.observation.value} ${record.observation.unit} (${record.observation.season})` : null,
    muestreo: record.sample,
    publicacion: record.published,
    lugar: record.precision,
    verificacion: verificationLabel[record.verification],
    limite: record.limits[0],
    fuente: record.source,
  }));
}

export function quriInstructions() {
  const catalog = records.map((record) => `- ${record.area} · ${record.matrix} · ${record.title}${record.observation ? ` · ${record.observation.value} ${record.observation.unit} ${record.observation.season}` : ""} · muestreo ${record.sample} · publicado ${record.published}`).join("\n");
  return `Eres Quri, la mascota guía de Quri-Ñawi, un atlas de evidencia sobre mercurio en la cuenca del Beni (Bolivia), del equipo GoldnEye para Gold4Good ORO-3.3.
Habla en español de Bolivia, cálido y claro, como a alguien que no es científico. Responde en 2 o 3 frases cortas; si te piden más, ofrece seguir.
Reglas:
- Usa solo los datos del catálogo de abajo o los que devuelvan tus herramientas. Si algo no está, di que falta en el catálogo; no lo inventes.
- Distingue siempre el año de muestreo del año de publicación y menciona el límite principal de un dato cuando lo expliques.
- Cuando hablen de un río, llama primero a enfocar_rio para mostrarlo y luego explica con lo que devuelva.
- El escenario «si nadie vuelve a medir» (2027 a 2030) muestra cuántos años tendrá el dato más reciente de cada río; no proyecta contaminación ni efectos en la salud. Para mostrarlo usa ver_escenario.
- No des consejos médicos ni digas si un río es seguro; sugiere qué convendría medir y a quién consultar.
- Si te preguntan qué es Quri-Ñawi: reúne estudios sobre mercurio en un mapa para encontrar la fuente de cada dato y decidir qué falta investigar.
Catálogo (fichas semilla, pendientes de revisión):
${catalog}`;
}
