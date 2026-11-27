/** Contrato web → cola privada existente; nunca incluye un token administrativo. */
export type Receipt = { id: string; estado: "pendiente_revision" | "aceptada" | "rechazada"; duplicado: boolean };
export type Draft = { title: string; url: string; territory: string; receipt?: Receipt };
export const proposalEndpoint = "https://goldeye-trace-mcp.pinata-server.workers.dev/mcp";

export function sourceUrl(value: string) {
  const source = value.trim();
  const url = new URL(/^10\.\d{4,9}\//i.test(source) ? "https://doi.org/" + source : source);
  if (url.protocol !== "https:" || url.username || url.password) throw new Error("La fuente debe ser un DOI o enlace HTTPS público.");
  url.hash = "";
  if (["doi.org", "dx.doi.org"].includes(url.hostname.toLowerCase())) {
    url.hostname = "doi.org";
    url.pathname = url.pathname.toLowerCase().replace(/\/$/, "");
    url.search = "";
  }
  return url.href;
}
export function parseDraft(value: unknown): Draft {
  if (!value || typeof value !== "object") throw new Error("Propuesta inválida.");
  const item = value as Partial<Draft>;
  if (typeof item.title !== "string" || !item.title.trim() || item.title.length > 150 || typeof item.url !== "string" || item.url.length > 500 || !["Beni", "Kaka", "Madre de Dios", "Otro"].includes(item.territory ?? "")) throw new Error("Completa título, fuente y territorio válidos.");
  return { title: item.title.trim(), url: sourceUrl(item.url), territory: item.territory! };
}
export function proposalCall(draft: Draft) {
  return { jsonrpc: "2.0", id: "quri-propuesta", method: "tools/call", params: { name: "proponer_candidato", arguments: { doi_o_url: draft.url, motivo: `Título propuesto: ${draft.title}. Territorio: ${draft.territory}. Referencia enviada desde Quri-Ñawi; requiere contraste documental, permiso y revisión humana. El expediente por campo se revisa por PR, no se publica desde la cola.` } } };
}
export async function sendProposal(draft: Draft, fetcher: typeof fetch = fetch): Promise<Receipt> {
  const response = await fetcher(proposalEndpoint, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json", "MCP-Protocol-Version": "2025-11-25" }, body: JSON.stringify(proposalCall(draft)), signal: AbortSignal.timeout(10_000), cache: "no-store", redirect: "error" });
  if (!response.ok) throw new Error("La cola no confirmó el almacenamiento.");
  const text = await response.text();
  if (text.length > 65_536) throw new Error("Respuesta de cola demasiado grande.");
  const message = JSON.parse(text);
  const receipt = message?.result?.structuredContent?.propuesta;
  if (message.id !== "quri-propuesta" || message.error || message.result?.isError || !/^p_[a-f0-9]{20}$/.test(receipt?.id ?? "") || !["pendiente_revision", "aceptada", "rechazada"].includes(receipt?.estado)) throw new Error("La cola no confirmó un identificador y estado válidos.");
  return { id: receipt.id, estado: receipt.estado, duplicado: receipt.duplicado === true };
}
