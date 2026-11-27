import type { Page } from "./extraction";

export const documentLimits = { bytes: 8 * 1024 * 1024, pages: 200, characters: 1_000_000, milliseconds: 30_000 } as const;
export async function readDocument(file: File): Promise<{ pages: Page[]; sha256: string }> {
  if (!file.size || file.size > documentLimits.bytes) throw new Error("El archivo debe tener contenido y pesar como máximo 8 MiB.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const sha256 = [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, "0")).join("");
  let pages: Page[];
  if (/\.txt$/i.test(file.name)) {
    let text: string;
    try { text = new TextDecoder("utf-8", { fatal: true }).decode(bytes); } catch { throw new Error("El TXT debe estar codificado en UTF-8."); }
    if (text.includes("\0")) throw new Error("El TXT contiene datos binarios ilegibles.");
    pages = text.split("\f").map((text, i) => ({ page: i + 1, text }));
  } else if (/\.pdf$/i.test(file.name) && new TextDecoder().decode(bytes.slice(0, 5)) === "%PDF-") {
    // Carga diferida: visitar el atlas no descarga PDF.js ni su worker.
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    const task = pdfjs.getDocument({ data: bytes, useSystemFonts: false, disableFontFace: true, useWasm: false, useWorkerFetch: false, stopAtErrors: true });
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      pages = await Promise.race([
        (async () => {
          const doc = await task.promise;
          if (doc.numPages > documentLimits.pages) throw new Error("El PDF supera las 200 páginas.");
          const result: Page[] = [];
          let characters = 0;
          for (let page = 1; page <= doc.numPages; page++) {
            const node = await doc.getPage(page);
            const content = await node.getTextContent();
            const text = content.items.map(item => "str" in item ? item.str + (item.hasEOL ? "\n" : " ") : "").join("");
            characters += text.length;
            if (characters > documentLimits.characters) throw new Error("El documento supera un millón de caracteres.");
            result.push({ page, text });
            node.cleanup();
          }
          return result;
        })(),
        new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error("La lectura superó 30 segundos. Usa un extracto de texto autorizado.")), documentLimits.milliseconds); }),
      ]);
    } catch (error) {
      throw new Error(error instanceof Error ? `No se pudo leer el PDF: ${error.message}` : "PDF ilegible o protegido. Prueba un TXT autorizado.");
    } finally {
      clearTimeout(timer);
      await task.destroy();
    }
  } else { throw new Error("Solo se aceptan PDF con texto o TXT UTF-8. No hay OCR para imágenes."); }
  if (pages.length > documentLimits.pages || pages.reduce((n, p) => n + p.text.length, 0) > documentLimits.characters) throw new Error("Límite de 200 páginas o un millón de caracteres superado.");
  if (pages.reduce((n, p) => n + p.text.trim().length, 0) < 30) throw new Error("No se encontró texto legible suficiente. El piloto no usa OCR; prueba un TXT autorizado.");
  return { pages, sha256 };
}
