import { quriInstructions, quriTools } from "../../../lib/quri-brief";

// Entrega al navegador una clave temporal de OpenAI Realtime para hablar con Quri.
// La clave del proyecto nunca sale del servidor; la sesión (modelo, instrucciones, herramientas) se fija aquí.
const MODEL = process.env.QURI_REALTIME_MODEL ?? "gpt-realtime-2.1-mini";
const WINDOW_MS = 10 * 60 * 1000;
const PER_CLIENT = 6;
const PER_WINDOW = 60;

// shortcut: límite en memoria por instancia del servidor; si el uso crece, pasar a un almacén compartido (KV/Redis).
const hits = new Map<string, number[]>();
let windowHits: number[] = [];

function allow(client: string) {
  const now = Date.now();
  windowHits = windowHits.filter((at) => now - at < WINDOW_MS);
  const mine = (hits.get(client) ?? []).filter((at) => now - at < WINDOW_MS);
  if (mine.length >= PER_CLIENT || windowHits.length >= PER_WINDOW) return false;
  mine.push(now);
  windowHits.push(now);
  hits.set(client, mine);
  return true;
}

export async function POST(request: Request) {
  const key = process.env.API_KEY_OPENAI ?? process.env.OPENAI_API_KEY;
  if (!key) return Response.json({ error: "Quri no tiene voz configurada en este servidor." }, { status: 503 });
  const client = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!allow(client)) return Response.json({ error: "Quri descansa un momento. Prueba en unos minutos." }, { status: 429 });

  const response = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      expires_after: { anchor: "created_at", seconds: 60 },
      session: {
        type: "realtime",
        model: MODEL,
        instructions: quriInstructions(),
        output_modalities: ["audio"],
        max_output_tokens: 350,
        audio: {
          input: { transcription: { model: "gpt-4o-mini-transcribe", language: "es" }, turn_detection: { type: "semantic_vad" } },
          output: { voice: "marin" },
        },
        tools: quriTools,
        tool_choice: "auto",
      },
    }),
  }).catch(() => null);
  if (!response?.ok) return Response.json({ error: "No se pudo abrir la conversación con Quri." }, { status: 502 });
  const data = (await response.json()) as { value?: string; expires_at?: number };
  if (!data.value) return Response.json({ error: "Respuesta inesperada del servicio de voz." }, { status: 502 });
  return Response.json({ value: data.value, expiresAt: data.expires_at }, { headers: { "Cache-Control": "no-store" } });
}
