export type Area = "Beni" | "Kaka" | "Madre de Dios";
export type Matrix = "Sedimentos" | "Peces" | "Datos agregados" | "Proyecto";

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
  review: string;
  precision: string;
  places: readonly { name: string; lon: number; lat: number }[];
};

const seed = "Ficha semilla · pendiente de revisión";

const beniReview = "https://www.scielo.org.bo/scielo.php?lng=en&nrm=iso&pid=S0250-54602025000200097&script=sci_arttext&tlng=en";
const reviewSource = "Revista Boliviana de Química · revisión de la cuenca del Beni";

export const areas: readonly Area[] = ["Beni", "Kaka", "Madre de Dios"];
export const matrices: readonly Matrix[] = ["Sedimentos", "Peces", "Datos agregados", "Proyecto"];

export const records: readonly Record[] = [
  {
    id: "kaka-seca",
    title: "Mercurio en sedimentos · época seca",
    area: "Kaka",
    matrix: "Sedimentos",
    sample: "1998",
    published: "2025",
    source: reviewSource,
    url: beniReview,
    note: "Observación histórica citada en la revisión. Quedan por comprobar el punto exacto y el método original.",
    observation: { value: "0,088", unit: "µg/g", season: "Época seca" },
    review: seed,
    precision: "Tramo aproximado; el punto de muestreo está por comprobar",
    places: [{ name: "Río Kaka", lon: -67.7283, lat: -15.4761 }],
  },
  {
    id: "kaka-humeda",
    title: "Mercurio en sedimentos · época húmeda",
    area: "Kaka",
    matrix: "Sedimentos",
    sample: "1998",
    published: "2025",
    source: reviewSource,
    url: beniReview,
    note: "Observación histórica citada en la revisión. Las dos fichas remiten al mismo documento.",
    observation: { value: "0,214", unit: "µg/g", season: "Época húmeda" },
    review: seed,
    precision: "Tramo aproximado; el punto de muestreo está por comprobar",
    places: [{ name: "Río Kaka", lon: -67.7283, lat: -15.4761 }],
  },
  {
    id: "peces-levy",
    title: "Elementos traza en peces comestibles del Beni",
    area: "Beni",
    matrix: "Peces",
    sample: "Jul–ago 2015",
    published: "2022",
    source: "Rodriguez-Levy et al. · Heliyon",
    url: "https://pubmed.ncbi.nlm.nih.gov/36444265/",
    note: "Las muestras se recogieron en mercados de Riberalta y Rurrenabaque. La ubicación de compra no confirma el punto de captura.",
    review: seed,
    precision: "Mercados de compra; no confirman el sitio de captura",
    places: [{ name: "Riberalta", lon: -66.1, lat: -10.983 }, { name: "Rurrenabaque", lon: -67.56, lat: -14.46 }],
  },
  {
    id: "peces-rurrenabaque",
    title: "Composición nutricional y mercurio en peces del Beni",
    area: "Beni",
    matrix: "Peces",
    sample: "Consultar el artículo",
    published: "2025 (DOI)",
    source: "Journal of Food Composition and Analysis · reseña UMSA",
    url: "https://dipgis.umsa.bo/?p=7902",
    note: "El estudio analiza diez especies. La ficha enlaza la reseña institucional y su referencia al artículo.",
    review: seed,
    precision: "Lugar de compra según la reseña; sitio de captura por confirmar",
    places: [{ name: "Rurrenabaque", lon: -67.56, lat: -14.46 }],
  },
  {
    id: "seladis-cedib",
    title: "Mercurio y salud en la Amazonía boliviana",
    area: "Madre de Dios",
    matrix: "Datos agregados",
    sample: "2023–2024",
    published: "2026",
    source: "SELADIS y CEDIB · informe del estudio piloto",
    url: "https://www.cedib.org/biblioteca/mercurio-y-salud-en-la-amazonia-boliviana-roger-carvajal/",
    note: "El estudio incluyó comunidades de Beni y Madre de Dios. Esta ficha enlaza al informe y omite datos individuales y ubicaciones precisas.",
    review: seed,
    precision: "Ubicación generalizada a la región; sin comunidades identificables",
    places: [{ name: "Madre de Dios", lon: -67.3038, lat: -11.4877 }],
  },
  {
    id: "planetgold",
    title: "Programa planetGOLD Bolivia",
    area: "Beni",
    matrix: "Proyecto",
    sample: "Alcance nacional",
    published: "Programa vigente en la fuente",
    source: "planetGOLD Bolivia",
    url: "https://www.planetgold.org/es/bolivia",
    note: "Referencia institucional para el trabajo sobre minería aurífera y mercurio. No representa un punto de muestreo.",
    review: seed,
    precision: "Alcance nacional; no es un punto de muestreo",
    places: [],
  },
];
