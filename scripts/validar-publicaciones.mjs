import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { validatePublication } from '../src/lib/review.ts';

const values = JSON.parse(await readFile(new URL('../src/lib/publications.json', import.meta.url), 'utf8'));
assert.ok(Array.isArray(values), 'Las publicaciones son una lista');
const ids = new Set();
const proposals = new Set();
for (const value of values) {
  validatePublication(value);
  assert.ok(!ids.has(value.record.id), 'ID de ficha repetido');
  assert.ok(!proposals.has(value.proposalId), 'Propuesta ya publicada');
  ids.add(value.record.id);
  proposals.add(value.proposalId);
}
console.log(`${values.length} publicaciones con revisión, autorización e historial válidos.`);
