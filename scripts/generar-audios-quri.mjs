import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const VERSION = "v1";
const VOICE_ID = (process.env.ELEVENLABS_VOICE_ID ?? "EXAVITQu4vr4xnSDxMaL").trim();
const MODEL_ID = (process.env.ELEVENLABS_MODEL_ID ?? "eleven_multilingual_v2").trim();
const API_KEY = (process.env.ELEVENLABS_API_KEY ?? "").trim();

const SCRIPTS = [
  {
    slug: "kaka",
    text: "En el río Kaka este catálogo reúne dos fichas semilla, pendientes de revisión, tomadas de una revisión de la cuenca del Beni publicada en 2025 por la Revista Boliviana de Química. Ambas registran mercurio en sedimentos muestreados en 1998: cero coma cero ochenta y ocho microgramos por gramo en época seca y cero coma doscientos catorce en época húmeda. La ubicación corresponde a un tramo aproximado y falta verificar el punto exacto y el método original. Además, faltan fichas en este catálogo de agua y de peces para este río.",
  },
  {
    slug: "beni",
    text: "En el río Beni hay tres fichas semilla, pendientes de revisión. Dos analizan peces comestibles: el estudio de Rodriguez-Levy en Heliyon, muestreado entre julio y agosto de 2015 y publicado en 2022, y un estudio de diez especies difundido por la UMSA con publicación de 2025, cuyo muestreo debe consultarse en el artículo. Ambos compraron pescado en mercados de Riberalta y Rurrenabaque, sin confirmar el sitio de captura. La tercera ficha es el programa vigente planetGOLD Bolivia, que no es un punto de muestreo. Además, faltan fichas en este catálogo de agua y de sedimentos.",
  },
  {
    slug: "madre-de-dios",
    text: "En el río Madre de Dios este catálogo cuenta con una ficha semilla, pendiente de revisión, basada en el informe piloto de SELADIS y CEDIB sobre mercurio y salud en la Amazonía boliviana, con muestreo de 2023 a 2024 y publicación en 2026. Por resguardo de privacidad, presenta datos agregados con ubicación generalizada a la región, sin comunidades ni personas identificables. Para este río todavía faltan fichas en este catálogo sobre agua, sedimentos y peces.",
  },
];

if (!API_KEY) {
  console.error("Falta ELEVENLABS_API_KEY en el entorno. Ejemplo: node --env-file=.env.local scripts/generar-audios-quri.mjs");
  process.exit(1);
}

const outDir = path.join(process.cwd(), "public", "audio");
await mkdir(outDir, { recursive: true });

for (const item of SCRIPTS) {
  const target = path.join(outDir, `quri-${item.slug}-${VERSION}.mp3`);
  try {
    await access(target);
    console.log(`[omitido] Ya existe ${path.relative(process.cwd(), target)} para la versión ${VERSION}.`);
    continue;
  } catch {
    // Generar archivo faltante.
  }

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(VOICE_ID)}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: {
        "xi-api-key": API_KEY,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: item.text,
        model_id: MODEL_ID,
        voice_settings: { stability: 0.58, similarity_boost: 0.72 },
      }),
      signal: AbortSignal.timeout(20_000),
    },
  );

  if (!response.ok) {
    throw new Error(`Error ${response.status} al sintetizar ${item.slug}: ${await response.text()}`);
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  await writeFile(target, bytes);
  console.log(`[generado] ${path.relative(process.cwd(), target)} (${bytes.byteLength} bytes, ${item.text.length} caracteres).`);
}
