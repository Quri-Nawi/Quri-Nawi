import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  getQuriScript,
  isKnownRiver,
  MAX_SCRIPT_CHARS,
  QURI_SCRIPT_VERSION,
} from "../../../lib/quri-scripts";

// Voz multilingüe por defecto de ElevenLabs ("Sarah" / voz clara y neutral), configurable por entorno.
const DEFAULT_VOICE_ID = "EXAVITQu4vr4xnSDxMaL";
const DEFAULT_MODEL_ID = "eleven_multilingual_v2";
const DEFAULT_QUOTA_CHARS = 5000;

const memoryCache = new Map<string, Uint8Array>();
let memoryUsedChars = 0;

const CACHE_DIR = path.join(process.cwd(), ".next", "cache", "quri-tts");
const QUOTA_FILE = path.join(CACHE_DIR, "quota.json");

function audioResponse(bytes: Uint8Array, source: string, commercialPlan: boolean): Response {
  const headers: Record<string, string> = {
    "Content-Type": "audio/mpeg",
    "Content-Length": String(bytes.byteLength),
    "Cache-Control": "public, max-age=31536000, immutable",
    "X-Quri-Audio-Source": source,
  };
  if (!commercialPlan) {
    headers["X-Quri-Attribution"] = "elevenlabs.io";
  }
  return new Response(Uint8Array.from(bytes), { status: 200, headers });
}

async function readUsedQuota(): Promise<number> {
  try {
    const raw = await readFile(QUOTA_FILE, "utf8");
    const parsed = JSON.parse(raw) as { usedChars?: unknown };
    if (typeof parsed.usedChars === "number" && Number.isFinite(parsed.usedChars)) {
      memoryUsedChars = Math.max(memoryUsedChars, parsed.usedChars);
    }
  } catch {
    // Si aún no existe el registro en disco, se usa el contador en memoria.
  }
  return memoryUsedChars;
}

async function saveUsedQuota(nextUsed: number): Promise<void> {
  memoryUsedChars = nextUsed;
  try {
    await mkdir(CACHE_DIR, { recursive: true });
    await writeFile(QUOTA_FILE, JSON.stringify({ usedChars: nextUsed, updatedAt: new Date().toISOString() }), "utf8");
  } catch {
    // Entornos de solo lectura conservan el control de cuota en memoria.
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rio = (searchParams.get("rio") ?? "").trim();
  const version = (searchParams.get("v") ?? QURI_SCRIPT_VERSION).trim();

  if (!isKnownRiver(rio)) {
    return Response.json(
      { error: "invalid_river", message: "Río no reconocido en este catálogo.", fallback: "text" },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const script = getQuriScript(rio);
  if (version !== script.version) {
    return Response.json(
      { error: "version_mismatch", currentVersion: script.version, fallback: "text" },
      { status: 409, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (script.transcript.length > MAX_SCRIPT_CHARS) {
    return Response.json(
      { error: "script_too_long", maxChars: MAX_SCRIPT_CHARS, fallback: "text" },
      { status: 422, headers: { "Cache-Control": "no-store" } },
    );
  }

  const commercialPlan = process.env.ELEVENLABS_PLAN_COMMERCIAL === "true";

  // 1. Reutilizar audio estático pre-generado por versión en public/audio/ si existe.
  if (script.staticAudioPath) {
    const staticFile = path.join(process.cwd(), "public", ...script.staticAudioPath.split("/").filter(Boolean));
    try {
      const fileBuffer = await readFile(staticFile);
      if (fileBuffer.byteLength > 0) {
        return audioResponse(new Uint8Array(fileBuffer), "static-versioned", commercialPlan);
      }
    } catch {
      // No existe aún el MP3 pre-generado; continuar con caché o síntesis en servidor.
    }
  }

  const voiceId = (process.env.ELEVENLABS_VOICE_ID ?? DEFAULT_VOICE_ID).trim();
  const modelId = (process.env.ELEVENLABS_MODEL_ID ?? DEFAULT_MODEL_ID).trim();
  const cacheKey = createHash("sha256")
    .update(`${script.id}|${script.version}|${voiceId}|${modelId}|${script.transcript}`)
    .digest("hex")
    .slice(0, 24);

  // 2. Caché en memoria y disco por versión del guion.
  const inMemory = memoryCache.get(cacheKey);
  if (inMemory) {
    return audioResponse(inMemory, "memory-cache", commercialPlan);
  }

  const diskCacheFile = path.join(CACHE_DIR, `${script.id}-${cacheKey}.mp3`);
  try {
    const cachedBuffer = await readFile(diskCacheFile);
    if (cachedBuffer.byteLength > 0) {
      const bytes = new Uint8Array(cachedBuffer);
      memoryCache.set(cacheKey, bytes);
      return audioResponse(bytes, "disk-cache", commercialPlan);
    }
  } catch {
    // Sin entrada previa en disco.
  }

  // 3. Clave de API solo en servidor.
  const apiKey = (process.env.ELEVENLABS_API_KEY ?? "").trim();
  if (!apiKey) {
    return Response.json(
      { error: "tts_unconfigured", fallback: "text" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  // 4. Control de cuota de caracteres para proteger créditos.
  const maxQuota = Number(process.env.ELEVENLABS_MAX_CHARS_QUOTA ?? DEFAULT_QUOTA_CHARS);
  const quotaLimit = Number.isFinite(maxQuota) && maxQuota > 0 ? maxQuota : DEFAULT_QUOTA_CHARS;
  const usedChars = await readUsedQuota();
  if (usedChars + script.transcript.length > quotaLimit) {
    return Response.json(
      { error: "quota_exceeded", usedChars, quotaLimit, fallback: "text" },
      { status: 429, headers: { "Cache-Control": "no-store" } },
    );
  }

  // 5. Llamada controlada a ElevenLabs Text-to-Speech.
  try {
    const upstream = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text: script.transcript,
          model_id: modelId,
          voice_settings: {
            stability: 0.58,
            similarity_boost: 0.72,
          },
        }),
        signal: AbortSignal.timeout(15_000),
      },
    );

    if (!upstream.ok) {
      return Response.json(
        { error: "upstream_tts_error", status: upstream.status, fallback: "text" },
        { status: 502, headers: { "Cache-Control": "no-store" } },
      );
    }

    const arrayBuffer = await upstream.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    if (bytes.byteLength === 0) {
      return Response.json(
        { error: "empty_audio", fallback: "text" },
        { status: 502, headers: { "Cache-Control": "no-store" } },
      );
    }

    memoryCache.set(cacheKey, bytes);
    await saveUsedQuota(usedChars + script.transcript.length);
    try {
      await mkdir(CACHE_DIR, { recursive: true });
      await writeFile(diskCacheFile, bytes);
    } catch {
      // Si el disco es de solo lectura, la caché en memoria sigue activa.
    }

    return audioResponse(bytes, "elevenlabs-live", commercialPlan);
  } catch {
    return Response.json(
      { error: "tts_network_failure", fallback: "text" },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
