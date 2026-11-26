import { records } from "./catalog";

export const QURI_SCRIPT_VERSION = "v1";
export const MAX_SCRIPT_CHARS = 750;

export const KNOWN_RIVERS = [
  "Kaka",
  "Beni",
  "Madre de Dios",
  "Alto Beni",
  "Mamoré",
  "Tuichi",
  "Coroico",
  "Orthon",
  "Mapiri",
] as const;

export type KnownRiver = (typeof KNOWN_RIVERS)[number];

export type QuriSource = {
  label: string;
  url: string;
};

export type QuriScript = {
  id: string;
  slug: string;
  version: string;
  river: string;
  hasRecords: boolean;
  durationEstimate: string;
  reviewStatus: string;
  contextHint: string;
  transcript: string;
  sources: readonly QuriSource[];
  staticAudioPath?: string;
};

function sourcesForArea(area: string): QuriSource[] {
  const seen = new Set<string>();
  const list: QuriSource[] = [];
  for (const item of records) {
    if (item.area === area && !seen.has(item.url)) {
      seen.add(item.url);
      list.push({ label: item.source, url: item.url });
    }
  }
  return list;
}

export function slugifyRiver(river: string): string {
  return river
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function isKnownRiver(river: string): river is KnownRiver {
  return (KNOWN_RIVERS as readonly string[]).includes(river);
}

const seedReviewStatus = "Guion v1 · basado en fichas semilla pendientes de revisión";

const curatedScripts: Record<"Kaka" | "Beni" | "Madre de Dios", QuriScript> = {
  Kaka: {
    id: `kaka-${QURI_SCRIPT_VERSION}`,
    slug: "kaka",
    version: QURI_SCRIPT_VERSION,
    river: "Kaka",
    hasRecords: true,
    durationEstimate: "~38 s",
    reviewStatus: seedReviewStatus,
    contextHint:
      "2 fichas semilla en sedimentos (muestreo de 1998, publicado en 2025). Falta verificar punto exacto y método; faltan fichas de agua y peces.",
    transcript:
      "En el río Kaka este catálogo reúne dos fichas semilla, pendientes de revisión, tomadas de una revisión de la cuenca del Beni publicada en 2025 por la Revista Boliviana de Química. Ambas registran mercurio en sedimentos muestreados en 1998: cero coma cero ochenta y ocho microgramos por gramo en época seca y cero coma doscientos catorce en época húmeda. La ubicación corresponde a un tramo aproximado y falta verificar el punto exacto y el método original. Además, faltan fichas en este catálogo de agua y de peces para este río.",
    sources: sourcesForArea("Kaka"),
    staticAudioPath: `/audio/quri-kaka-${QURI_SCRIPT_VERSION}.mp3`,
  },
  Beni: {
    id: `beni-${QURI_SCRIPT_VERSION}`,
    slug: "beni",
    version: QURI_SCRIPT_VERSION,
    river: "Beni",
    hasRecords: true,
    durationEstimate: "~40 s",
    reviewStatus: seedReviewStatus,
    contextHint:
      "3 fichas semilla: dos estudios en peces de mercado (2015/2022 y 2025) sin captura confirmada y planetGOLD Bolivia. Faltan fichas de agua y sedimentos.",
    transcript:
      "En el río Beni hay tres fichas semilla, pendientes de revisión. Dos analizan peces comestibles: el estudio de Rodriguez-Levy en Heliyon, muestreado entre julio y agosto de 2015 y publicado en 2022, y un estudio de diez especies difundido por la UMSA con publicación de 2025, cuyo muestreo debe consultarse en el artículo. Ambos compraron pescado en mercados de Riberalta y Rurrenabaque, sin confirmar el sitio de captura. La tercera ficha es el programa vigente planetGOLD Bolivia, que no es un punto de muestreo. Además, faltan fichas en este catálogo de agua y de sedimentos.",
    sources: sourcesForArea("Beni"),
    staticAudioPath: `/audio/quri-beni-${QURI_SCRIPT_VERSION}.mp3`,
  },
  "Madre de Dios": {
    id: `madre-de-dios-${QURI_SCRIPT_VERSION}`,
    slug: "madre-de-dios",
    version: QURI_SCRIPT_VERSION,
    river: "Madre de Dios",
    hasRecords: true,
    durationEstimate: "~33 s",
    reviewStatus: seedReviewStatus,
    contextHint:
      "1 ficha semilla con datos agregados de salud (muestreo 2023–2024, publicación 2026) y ubicación regional. Faltan fichas de agua, sedimentos y peces.",
    transcript:
      "En el río Madre de Dios este catálogo cuenta con una ficha semilla, pendiente de revisión, basada en el informe piloto de SELADIS y CEDIB sobre mercurio y salud en la Amazonía boliviana, con muestreo de 2023 a 2024 y publicación en 2026. Por resguardo de privacidad, presenta datos agregados con ubicación generalizada a la región, sin comunidades ni personas identificables. Para este río todavía faltan fichas en este catálogo sobre agua, sedimentos y peces.",
    sources: sourcesForArea("Madre de Dios"),
    staticAudioPath: `/audio/quri-madre-de-dios-${QURI_SCRIPT_VERSION}.mp3`,
  },
};

export function getQuriScript(river: string): QuriScript {
  if (river === "Kaka" || river === "Beni" || river === "Madre de Dios") {
    return curatedScripts[river];
  }
  const cleanName = isKnownRiver(river) ? river : "seleccionado";
  const slug = slugifyRiver(cleanName);
  return {
    id: `sin-fichas-${slug}-${QURI_SCRIPT_VERSION}`,
    slug: `sin-fichas-${slug}`,
    version: QURI_SCRIPT_VERSION,
    river: cleanName,
    hasRecords: false,
    durationEstimate: "~30 s",
    reviewStatus: "Guion v1 · aviso de cobertura del catálogo semilla",
    contextHint:
      "Faltan fichas en este catálogo para este río. Aún no se han incorporado estudios revisados en este tramo.",
    transcript: `Para el río ${cleanName}, todavía faltan fichas en este catálogo. Que no figuren registros aquí no indica ausencia de mercurio ni de investigaciones, sino que aún no se han cargado fuentes verificadas para este cauce en la versión semilla. Si conoces un informe o artículo científico con enlace público o DOI, puedes registrarlo como propuesta en la sección Aportar para su revisión.`,
    sources: [],
  };
}
