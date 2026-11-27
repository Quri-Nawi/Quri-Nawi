import publications from "./publications.json" with { type: "json" };
import { publicPublications } from "./review.ts";

export type Area = "Beni" | "Kaka" | "Madre de Dios";
export type Matrix = "Sedimentos" | "Peces" | "Datos agregados" | "Proyecto";

/**
 * Nivel de verificación de una ficha. Cada nivel responde a una pregunta concreta:
 * - primaria: se leyó el texto de la fuente original y las cifras de la ficha figuran en él.
 * - secundaria: las cifras coinciden en fuentes confiables que citan el original, que no se abrió.
 * - parcial: hay respaldo, pero en una sola fuente o con diferencias de alcance.
 * - sin-verificar: se conserva como pista, sin respaldo.
 */
export type Verification = "primaria" | "secundaria" | "parcial" | "sin-verificar";
export type EvidenceType = "Revisión por pares" | "Informe técnico" | "Prensa especializada" | "Sitio oficial";

export type Record = {
  id: string;
  title: string;
  area: Area;
  matrix: Matrix;
  sample: string;
  published: string;
  source: string;
  url: string;
  note: string;
  observation?: { value: string; unit: string; season: string };
  verification: Verification;
  evidenceType: EvidenceType;
  /** Fecha de la última comprobación contra la fuente. */
  checked: string;
  /** Cifras o hechos de la ficha que se comprobaron, con la página cuando existe. */
  claims: readonly string[];
  /** Lo que la ficha no permite concluir. Nunca está vacío. */
  limits: readonly string[];
  /** Identificadores de docs/fuentes/REGISTRO_FUENTES.csv. */
  sourceIds: readonly string[];
  precision: string;
  places: readonly { name: string; lon: number; lat: number }[];
  /** Qué mide la ficha, si trae una medición de mercurio; la usa el escenario de antigüedad del dato. */
  measures?: "ambiente" | "peces" | "personas";
};

export const verificationLabel: { readonly [K in Verification]: string } = {
  primaria: "Verificada en la fuente",
  secundaria: "Verificada en fuentes secundarias",
  parcial: "Verificación parcial",
  "sin-verificar": "Sin verificar",
};

const checked = "2026-11-26";
const beniReview = "https://www.scielo.org.bo/scielo.php?lng=en&nrm=iso&pid=S0250-54602025000200097&script=sci_arttext&tlng=en";
const reviewSource = "Revista Boliviana de Química · revisión de la cuenca del Beni";
const kakaLimits = [
  "El texto leído no nombra la referencia original de este valor: faltan el método y el punto exacto de muestreo.",
  "Referencias históricas candidatas: Maurice-Bourgoin y colegas (1999 y 2001). Su texto no estuvo disponible el 26 de noviembre de 2026.",
  "Es un dato de un solo año citado por una sola revisión: no describe la situación actual del río.",
] as const;
const cedibUnits = "El resumen en español escribe mg/g y el resto del informe µg/g; aquí se usa µg/g, que equivale a ppm.";
const cedibLimits = [
  "Las mujeres de esta fase se seleccionaron por tener más de 1 ppm en una fase previa (p. 33): la media no representa a la población.",
  "Participaron voluntarias de comunidades cercanas a centros poblados. El informe no declara revisión por pares.",
  cedibUnits,
] as const;

export const areas: readonly Area[] = ["Beni", "Kaka", "Madre de Dios"];
export const matrices: readonly Matrix[] = ["Sedimentos", "Peces", "Datos agregados", "Proyecto"];

export const seedRecords: readonly Record[] = [
  {
    id: "kaka-seca",
    measures: "ambiente",
    title: "Mercurio en sedimentos · época seca",
    area: "Kaka",
    matrix: "Sedimentos",
    sample: "1998",
    published: "2025",
    source: reviewSource,
    url: beniReview,
    note: "Observación histórica citada en la revisión de 2025. Las dos fichas del Kaka remiten al mismo documento.",
    observation: { value: "0,088", unit: "µg/g", season: "Época seca" },
    verification: "secundaria",
    evidenceType: "Revisión por pares",
    checked,
    claims: ["El valor 0,088 µg/g (sedimentos del Kaka, 1998, época seca) figura en el texto de la revisión de 2025."],
    limits: kakaLimits,
    sourceIds: ["S23"],
    precision: "Tramo aproximado del río; el punto de muestreo no consta en la revisión",
    places: [{ name: "Río Kaka", lon: -67.7283, lat: -15.4761 }],
  },
  {
    id: "kaka-humeda",
    measures: "ambiente",
    title: "Mercurio en sedimentos · época húmeda",
    area: "Kaka",
    matrix: "Sedimentos",
    sample: "1998",
    published: "2025",
    source: reviewSource,
    url: beniReview,
    note: "Observación histórica citada en la revisión de 2025. Las dos fichas del Kaka remiten al mismo documento.",
    observation: { value: "0,214", unit: "µg/g", season: "Época húmeda" },
    verification: "secundaria",
    evidenceType: "Revisión por pares",
    checked,
    claims: ["El valor 0,214 µg/g (sedimentos del Kaka, 1998, época húmeda) figura en el texto de la revisión de 2025."],
    limits: kakaLimits,
    sourceIds: ["S23"],
    precision: "Tramo aproximado del río; el punto de muestreo no consta en la revisión",
    places: [{ name: "Río Kaka", lon: -67.7283, lat: -15.4761 }],
  },
  {
    id: "peces-levy",
    measures: "peces",
    title: "Elementos traza en peces comestibles del Beni",
    area: "Beni",
    matrix: "Peces",
    sample: "Jul–ago 2015",
    published: "2022",
    source: "Rodriguez-Levy et al. · Heliyon",
    url: "https://pubmed.ncbi.nlm.nih.gov/36444265/",
    note: "Artículo con licencia CC BY-NC-ND 4.0: se enlaza y no se redistribuye. Las muestras se compraron en mercados de Riberalta y Rurrenabaque.",
    observation: { value: "0,19", unit: "µg/g · mediana (peso húmedo)", season: "Estación seca · 106 peces" },
    verification: "primaria",
    evidenceType: "Revisión por pares",
    checked,
    claims: [
      "106 peces de 35 especies, comprados en mercados de Riberalta y Rurrenabaque en julio y agosto de 2015 (estación seca).",
      "Mediana de mercurio de 0,19 µg/g en peso húmedo; percentil 5 de 0,03 y percentil 95 de 1,30.",
    ],
    limits: [
      "El mercado de compra no confirma el sitio de captura.",
      "El texto reporta 106 peces en total, pero las muestras por zona suman 102.",
      "Muestreo de una sola temporada: no describe cambios en el tiempo.",
    ],
    sourceIds: ["S22"],
    precision: "Mercados de compra; no confirman el sitio de captura",
    places: [{ name: "Riberalta", lon: -66.1, lat: -10.983 }, { name: "Rurrenabaque", lon: -67.56, lat: -14.46 }],
  },
  {
    id: "peces-rurrenabaque",
    measures: "peces",
    title: "Composición nutricional y mercurio en peces del Beni",
    area: "Beni",
    matrix: "Peces",
    sample: "No indicada en la reseña",
    published: "2025 (en línea el 24 dic 2025)",
    source: "Loayza et al. · J Food Compos Anal 150:108840 · reseña UMSA",
    url: "https://dipgis.umsa.bo/?p=7902",
    note: "Diez especies compradas en un mercado de Rurrenabaque. La ficha enlaza la reseña institucional; el artículo tiene el DOI 10.1016/j.jfca.2025.108840.",
    observation: { value: "1,9 ± 1,0", unit: "ppm · blanquillo", season: "Pesca artesanal" },
    verification: "secundaria",
    evidenceType: "Revisión por pares",
    checked,
    claims: [
      "El estudio analizó diez especies de peces consumidos en el Beni, compradas en un mercado de Rurrenabaque.",
      "El blanquillo llegó a 1,9 ± 1,0 ppm de mercurio y cerca de la mitad de las especies superó 0,5 mg/kg, la referencia de la Unión Europea.",
    ],
    limits: [
      "El artículo completo no se abrió: las cifras vienen de la reseña de la UMSA. El DOI sí resuelve en Crossref.",
      "La reseña no indica la fecha de muestreo.",
      "El mercado de compra no confirma el sitio de captura.",
    ],
    sourceIds: ["S24"],
    precision: "Lugar de compra según la reseña; sitio de captura sin confirmar",
    places: [{ name: "Rurrenabaque", lon: -67.56, lat: -14.46 }],
  },
  {
    id: "cedib-beni",
    measures: "personas",
    title: "Mercurio en cabello de mujeres de Rurrenabaque (río Beni)",
    area: "Beni",
    matrix: "Datos agregados",
    sample: "2023–2024",
    published: "2026",
    source: "CEDIB, SELADIS-UMSA y Universidad de Cartagena · Mercurio y salud en la Amazonía boliviana",
    url: "https://www.cedib.org/biblioteca/mercurio-y-salud-en-la-amazonia-boliviana-roger-carvajal/",
    note: "Estudio piloto transversal. Esta ficha publica solo resultados agregados: sin datos individuales ni comunidades identificables.",
    observation: { value: "5,18 ± 4,54", unit: "µg/g · media en cabello (n = 50)", season: "Mujeres con más de 1 µg/g en una fase previa" },
    verification: "primaria",
    evidenceType: "Informe técnico",
    checked,
    claims: [
      "Media de 5,18 ± 4,54 µg/g de mercurio en cabello en 50 mujeres de Rurrenabaque (Fig. 12, p. 47).",
      "Promedio de las medias comunitarias de la Fase 1 en el Beni: 6,70 ± 2,18 µg/g (Tabla 1, p. 45).",
      "Estudio desarrollado en 2023 y 2024 (p. 31), con aval de comités de ética de Bolivia y de la Universidad de Cartagena (p. 34).",
    ],
    limits: [...cedibLimits, "El tamaño de la muestra cambia entre secciones del documento (50, 51 y 53 mujeres en el Beni)."],
    sourceIds: ["S46", "S01", "S02"],
    precision: "Región de Rurrenabaque; sin comunidades identificables",
    places: [{ name: "Rurrenabaque", lon: -67.56, lat: -14.46 }],
  },
  {
    id: "cedib-madre-de-dios",
    measures: "personas",
    title: "Mercurio en cabello de mujeres de Riberalta (Madre de Dios)",
    area: "Madre de Dios",
    matrix: "Datos agregados",
    sample: "2023–2024",
    published: "2026",
    source: "CEDIB, SELADIS-UMSA y Universidad de Cartagena · Mercurio y salud en la Amazonía boliviana",
    url: "https://www.cedib.org/biblioteca/mercurio-y-salud-en-la-amazonia-boliviana-roger-carvajal/",
    note: "Estudio piloto transversal. Esta ficha publica solo resultados agregados: sin datos individuales ni comunidades identificables.",
    observation: { value: "3,26 ± 1,65", unit: "µg/g · media en cabello (n = 69)", season: "Mujeres con más de 1 µg/g en una fase previa" },
    verification: "primaria",
    evidenceType: "Informe técnico",
    checked,
    claims: [
      "Media de 3,26 ± 1,65 µg/g de mercurio en cabello en 69 mujeres de Riberalta (Fig. 12, p. 47).",
      "Promedio de las medias comunitarias de la Fase 1 en Madre de Dios: 2,76 ± 0,49 µg/g (Tabla 1, p. 45).",
      "La diferencia con el Beni es significativa en la prueba t (p = 0,006).",
    ],
    limits: [...cedibLimits, "El tamaño de la muestra cambia entre secciones del documento (69, 70 y 46 mujeres en Madre de Dios)."],
    sourceIds: ["S46", "S01", "S02"],
    precision: "Ubicación generalizada a la región; sin comunidades identificables",
    places: [{ name: "Madre de Dios", lon: -67.3038, lat: -11.4877 }],
  },
  {
    id: "cpilap-2023",
    measures: "personas",
    title: "Mercurio en cabello de 302 personas de 36 comunidades indígenas (CPILAP y UMSA)",
    area: "Beni",
    matrix: "Datos agregados",
    sample: "2022–2023",
    published: "Junio de 2023",
    source: "Mongabay Latam · informe de CPILAP con laboratorios de la UMSA",
    url: "https://es.mongabay.com/2023/07/pueblos-indigenas-presentan-altos-indices-de-mercurio-en-su-cuerpo-bolivia/",
    note: "Informe «Contaminación por mercurio en comunidades indígenas asentadas en los ríos Madre de Dios y Beni». Se publican solo cifras agregadas.",
    observation: { value: "74,5", unit: "% sobre 1 µg/g (225 de 302 personas)", season: "Cabello · seis pueblos indígenas" },
    verification: "secundaria",
    evidenceType: "Prensa especializada",
    checked,
    claims: [
      "CPILAP, con laboratorios de la UMSA, analizó cabello de 302 personas de 36 comunidades de seis pueblos indígenas.",
      "El 74,5 % (225 de 302) superó 1 ppm, según Mongabay Latam.",
      "Prensa Mercosur reporta concentraciones entre 1,9 y 6,9 ppm.",
    ],
    limits: [
      "El informe original no se abrió: las cifras vienen de prensa (Mongabay Latam, Prensa Mercosur y eju.tv).",
      "Otras notas dan 305 personas, 71,3 % (presentación preliminar) o 227 de 302 (75 %). Aquí se usa 74,5 % porque Mongabay da también el recuento.",
      "La media de 3,93 ppm la reporta un solo medio (eju.tv).",
      "No consta que la muestra sea representativa de toda la Amazonía boliviana.",
    ],
    sourceIds: ["S09", "S10", "S47"],
    precision: "Sin ubicación pública: 36 comunidades de seis pueblos; no se publican comunidades identificables",
    places: [],
  },
  {
    id: "cejis-2021",
    title: "Dragas de oro en el río Madre de Dios (CEJIS, 2021)",
    area: "Madre de Dios",
    matrix: "Datos agregados",
    sample: "Ago–sep 2021",
    published: "2022",
    source: "Mongabay Latam · estudio de CEJIS y CEDIB",
    url: "https://es.mongabay.com/2022/10/estudio-revela-que-balsas-mineras-liberan-mercurio-en-el-rio-madre-de-dios-en-bolivia/",
    note: "Observación de un mes en seis comunidades del TIM II. Es una cifra de 2021, no de hoy.",
    observation: { value: "180", unit: "dragas en 172 km · 166 ilegales según CEJIS", season: "Ago–sep 2021" },
    verification: "secundaria",
    evidenceType: "Prensa especializada",
    checked,
    claims: [
      "CEJIS registró 180 dragas a lo largo de 172 km del río Madre de Dios entre agosto y septiembre de 2021.",
      "CEJIS afirma que 166 (92,3 %) operaban de forma ilegal y estimó 259 kg de mercurio liberados en ese mes.",
    ],
    limits: [
      "Otro estudio de 2025 cuenta 203 dragas en el TIM II (ficha dragas-2025): no son comparables sin revisar el método.",
      "El informe original de CEJIS no se abrió: las cifras se repiten en varias notas de Mongabay Latam.",
      "La ilegalidad es afirmación de CEJIS y los 259 kg son un cálculo a partir del uso promedio por balsa, no una medición en el río.",
    ],
    sourceIds: ["S11", "S09"],
    precision: "Tramo de 172 km del río Madre de Dios; sin ubicación de cada draga",
    places: [{ name: "Madre de Dios", lon: -67.3038, lat: -11.4877 }],
  },
  {
    id: "dragas-2025",
    title: "Dragas en el TIM II del río Madre de Dios (2025)",
    area: "Madre de Dios",
    matrix: "Datos agregados",
    sample: "2025",
    published: "Mayo de 2025",
    source: "Mongabay Latam · estudio de 2025 sobre el Madre de Dios",
    url: "https://es.mongabay.com/2025/05/bolivia-dragas-mineria-oro-ilegalmente-rio-madre-de-dios/",
    note: "La demanda de julio de 2025 afirma que el 90 % de las operaciones serían ilegales: es una afirmación de parte.",
    observation: { value: "203", unit: "dragas · 23 con autorización temporal", season: "2025 · TIM II" },
    verification: "secundaria",
    evidenceType: "Prensa especializada",
    checked,
    claims: ["Un estudio de 2025 identificó 203 dragas en el TIM II: 23 con autorización temporal y 180 sin ella."],
    limits: [
      "Cifra de prensa sobre un estudio cuyo informe original no se abrió.",
      "Según la nota, las 23 autorizaciones las otorga una cooperativa (Asobal).",
      "El 180 sin autorización de 2025 no es el 180 dragas de 2021.",
    ],
    sourceIds: ["S12", "S13"],
    precision: "Territorio indígena TIM II; sin ubicación de cada draga",
    places: [{ name: "Madre de Dios", lon: -67.3038, lat: -11.4877 }],
  },
  {
    id: "mongabay-2026",
    title: "Base de Mongabay Latam sobre mercurio en la Amazonía",
    area: "Beni",
    matrix: "Datos agregados",
    sample: "Estudios de 1997 a 2024",
    published: "Agosto de 2026",
    source: "Mongabay Latam · base de datos y análisis",
    url: "https://es.mongabay.com/2026/08/oro-toxico-mercurio-mineria-amenaza-comunidades-cuenca-rio-beni-bolivia/",
    note: "Análisis periodístico de la literatura científica. Sirve para ubicar vacíos, no reemplaza a los estudios.",
    observation: { value: "39 + 125", unit: "comunidades con valores altos y en riesgo en Bolivia", season: "39 estudios en 3 países, 7 en Bolivia" },
    verification: "secundaria",
    evidenceType: "Prensa especializada",
    checked,
    claims: [
      "Mongabay Latam revisó 39 estudios (1997 a 2024) de tres países; siete son de Bolivia.",
      "En Bolivia identifica 39 comunidades con valores altos de mercurio y 125 en riesgo.",
      "En los tres países, de 951 comunidades analizadas, 249 están expuestas y 702 en riesgo.",
    ],
    limits: [
      "La edición en inglés de una nota habla de 42 estudios (1995 a 2024); las notas en español, de 39 (1997 a 2024).",
      "«39 estudios» y «39 comunidades» son dos datos distintos que coinciden en el número.",
      "Es un análisis periodístico: no está revisado por pares.",
    ],
    sourceIds: ["S03", "S04", "S06"],
    precision: "Cuenca del Beni; sin ubicación de comunidades",
    places: [],
  },
  {
    id: "planetgold",
    title: "Programa planetGOLD Bolivia",
    area: "Beni",
    matrix: "Proyecto",
    sample: "No aplica (proyecto)",
    published: "Página consultada el 26 nov 2026",
    source: "planetGOLD Bolivia",
    url: "https://www.planetgold.org/es/bolivia",
    note: "Referencia institucional para el trabajo sobre minería aurífera y mercurio. No representa un punto de muestreo.",
    observation: { value: "18", unit: "t de mercurio · meta de reducción en 5 años", season: "Meta del proyecto" },
    verification: "primaria",
    evidenceType: "Sitio oficial",
    checked,
    claims: [
      "El programa lo implementa ONUDI, lo ejecuta Projekt-Consult y lo apoya el GEF.",
      "Su meta es reducir en 18 toneladas el uso de mercurio durante cinco años.",
    ],
    limits: [
      "La web habla de cuatro distritos mineros (sin nombrarlos) y el folleto oficial de cinco.",
      "La web no publica fechas de inicio ni de fin. El listado del GEF en IICA indica un fin previsto el 31 de diciembre de 2025: confirmar la vigencia con el programa antes de llamarlo vigente.",
      "Es una referencia institucional, no un punto de muestreo.",
    ],
    sourceIds: ["S31", "S32", "S33"],
    precision: "Alcance nacional; no es un punto de muestreo",
    places: [],
  },
];

/** Semillas documentales visibles; no equivalen a aprobación institucional. */
export const reviewedPublications = publicPublications(publications);
export const records: readonly Record[] = [...seedRecords, ...reviewedPublications.map(item => item.record)];
