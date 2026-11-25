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
};

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
  },
];
