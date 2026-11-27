import type { Record as CatalogRecord } from "./catalog";

/** Créditos de la obra citada, no atribuciones de revisión de Quri-Ñawi. */
export type Credit = {
  name: string;
  role: string;
  kind?: "person" | "organization";
  institution: string | null;
  sourceId: string;
  profileUrl?: string;
};

export type Authorship = {
  workId: string;
  workLabel: string;
  recordIds: readonly string[];
  credits: readonly Credit[];
  note: string;
};

export const authorships: readonly Authorship[] = [
  {
    workId: "S23", workLabel: "Metaanálisis de la cuenca del Beni", recordIds: ["kaka-seca", "kaka-humeda"],
    credits: [
      { name: "Fabiola Valdivieso", role: "Autora de la revisión", institution: "IIQ-Ambiental, UMSA", sourceId: "S23" },
      { name: "José A. Bravo", role: "Autor de la revisión", institution: "IIQ-Ambiental, UMSA", sourceId: "S23" },
      { name: "Ebbe Yapu Tapia", role: "Autor de la revisión", institution: "IIQ-Ambiental, UMSA", sourceId: "S23" },
    ],
    note: "La revisión cita valores de 1998. La autoría de la medición original del Kaka aún no está confirmada.",
  },
  {
    workId: "S22", workLabel: "Artículo de peces de la Amazonía boliviana", recordIds: ["peces-levy"],
    credits: [
      { name: "Inti E. Rodriguez-Levy", role: "Autor", institution: "Universidad Católica Boliviana y Universidad de Amberes", sourceId: "S22" },
      { name: "Paul A. Van Damme", role: "Autor", institution: "FAUNAGUA", sourceId: "S22" },
      { name: "Fernando M. Carvajal-Vallejos", role: "Autor", institution: "FAUNAGUA", sourceId: "S22" },
      { name: "Lieven Bervoets", role: "Autor", institution: "Universidad de Amberes", sourceId: "S22" },
    ],
    note: "Afiliaciones consignadas en el registro bibliográfico de PubMed; no indican vínculo laboral actual.",
  },
  {
    workId: "S24", workLabel: "Artículo de composición nutricional y mercurio", recordIds: ["peces-rurrenabaque"],
    credits: [
      { name: "Erick Loayza", role: "Autor citado", institution: "Universidad San Francisco Xavier de Chuquisaca", sourceId: "S24" },
      { name: "Mauricio Peñarrieta", role: "Autor citado", institution: "Instituto de Investigaciones Químicas, UMSA", sourceId: "S24" },
      { name: "Darío Achá", role: "Autor citado", institution: "Instituto de Ecología, UMSA", sourceId: "S24" },
      { name: "Guido Miranda-Chumacero", role: "Autor citado", institution: "WCS-Bolivia", sourceId: "S24" },
    ],
    note: "La reseña institucional nombra al equipo; el artículo completo no se abrió en esta revisión.",
  },
  {
    workId: "S46", workLabel: "Informe Mercurio y salud en la Amazonía boliviana", recordIds: ["cedib-beni", "cedib-madre-de-dios"],
    credits: [
      { name: "Roger Carvajal Saravia", role: "Autor en la ficha de CEDIB; editor en la portada del informe", institution: "SELADIS, UMSA", sourceId: "S01" },
      { name: "UMSA, CEDIB y Universidad de Cartagena", role: "Instituciones participantes", kind: "organization", institution: null, sourceId: "S46" },
    ],
    note: "La ficha de CEDIB y el informe describen papeles distintos. No se atribuye aquí a una sola persona la autoría de todos los capítulos.",
  },
  {
    workId: "S09", workLabel: "Informe CPILAP sobre mercurio en comunidades", recordIds: ["cpilap-2023"],
    credits: [{ name: "CPILAP y laboratorios de la UMSA", role: "Organizaciones vinculadas según prensa", kind: "organization", institution: null, sourceId: "S09" }],
    note: "El informe original no se abrió. Autoría individual e institución de cada participante: no documentadas.",
  },
  {
    workId: "S11", workLabel: "Estudio de dragas del Madre de Dios de 2021", recordIds: ["cejis-2021"],
    credits: [{ name: "CEJIS y CEDIB", role: "Organizaciones vinculadas según prensa", kind: "organization", institution: null, sourceId: "S11" }],
    note: "El informe original no se abrió. La periodista que lo reporta no se presenta como autora del estudio.",
  },
  {
    workId: "S12", workLabel: "Estudio de dragas del TIM II de 2025", recordIds: ["dragas-2025"],
    credits: [],
    note: "La nota consultada no permite atribuir con seguridad la autoría individual del estudio original.",
  },
  {
    workId: "S04", workLabel: "Análisis periodístico de Mongabay Latam", recordIds: ["mongabay-2026"],
    credits: [{ name: "Mongabay Latam", role: "Medio que publica el análisis", kind: "organization", institution: null, sourceId: "S04" }],
    note: "El medio no equivale a una persona investigadora; la atribución individual requiere revisar la firma de la pieza.",
  },
  {
    workId: "S31", workLabel: "Página institucional de planetGOLD Bolivia", recordIds: ["planetgold"],
    credits: [{ name: "planetGOLD Bolivia", role: "Programa responsable de la página", kind: "organization", institution: null, sourceId: "S31" }],
    note: "Es una página de proyecto, no un estudio con autoría científica individual.",
  },
];

export function authorshipFor(recordId: string): Authorship | undefined {
  return authorships.find((entry) => entry.recordIds.includes(recordId));
}

export function relatedRecords(entry: Authorship, records: readonly CatalogRecord[]): CatalogRecord[] {
  return records.filter((record) => entry.recordIds.includes(record.id));
}
