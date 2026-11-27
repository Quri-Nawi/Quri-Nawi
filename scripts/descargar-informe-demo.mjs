// Descarga de alcance acotado: el documento permanece excluido de Git.
import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const url = 'https://www.cedib.org/wp-content/uploads/2026/08/MERCURIO-Y-SALUD-EN-LA-AMAZONIA-BOLIVIANA-.pdf';
const expected = '5aa2ff430cd30e34f693d6ab7a61448f7352dc417199e219c1d9fb8a4e88c137';
const response = await fetch(url, { signal: AbortSignal.timeout(45_000) });
if (!response.ok) throw new Error(`CEDIB respondió ${response.status}.`);
const reader = response.body.getReader();
const chunks = [];
let length = 0;
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  length += value.byteLength;
  if (length > 8 * 1024 * 1024) { await reader.cancel(); throw new Error('El informe supera 8 MiB.'); }
  chunks.push(value);
}
const buffer = Buffer.concat(chunks);
if (createHash('sha256').update(buffer).digest('hex') !== expected) throw new Error('La fuente cambió. Cotejar una nueva versión antes de modificar el caso de referencia.');
await mkdir(new URL('./.cache/', import.meta.url), { recursive: true });
await writeFile(new URL('./.cache/informe-cedib.pdf', import.meta.url), buffer);
console.log('Informe original guardado en scripts/.cache/informe-cedib.pdf; huella comprobada. No se redistribuye en Git.');
