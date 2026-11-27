import { parseDraft, sendProposal } from "../../../lib/proposals.ts";

const headers = { "Cache-Control": "no-store" };
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  let sameOrigin = false;
  try { sameOrigin = Boolean(origin) && new URL(origin!).host === (request.headers.get("host") ?? new URL(request.url).host); } catch { /* Origen inválido. */ }
  if (!sameOrigin) return Response.json({ error: "Origen no permitido." }, { status: 403, headers });
  if (process.env.QURI_PROPOSALS_ENABLED !== "1") return Response.json({ error: "El envío a la cola aún no está habilitado. Conserva el borrador y descarga el expediente para revisión por PR." }, { status: 503, headers });
  if (!request.headers.get("content-type")?.startsWith("application/json")) return Response.json({ error: "Se requiere JSON." }, { status: 415, headers });
  try {
    const reader = request.body?.getReader();
    if (!reader) throw new Error("Propuesta vacía.");
    const chunks: Uint8Array[] = [];
    let length = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > 4096) {
        await reader.cancel();
        return Response.json({ error: "Propuesta demasiado grande." }, { status: 413, headers });
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    const draft = parseDraft(JSON.parse(new TextDecoder().decode(bytes)));
    try {
      return Response.json(await sendProposal(draft), { headers });
    } catch {
      return Response.json({ error: "La cola no confirmó el envío. Tu borrador sigue disponible; puedes reintentar sin crear otra propuesta para la misma fuente." }, { status: 502, headers });
    }
  } catch {
    return Response.json({ error: "Propuesta inválida. Revisa título, enlace HTTPS y territorio." }, { status: 400, headers });
  }
}
