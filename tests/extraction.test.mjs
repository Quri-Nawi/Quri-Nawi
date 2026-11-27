import { test } from 'node:test';
import assert from 'node:assert/strict';
import { suggestFields, reviewExtraction, extractionFields } from '../src/lib/extraction.ts';
import { readDocument } from '../src/lib/read-document.ts';

const text = 'Título: Informe de prueba\nAutores: Persona Uno\nMuestras de cabello para un ejemplo sintético de revisión.\n';
const pages = [{ page: 1, text }];
const suggestions = suggestFields(pages);
const decisions = () => Object.fromEntries(Object.keys(extractionFields).map(field => [field, { action: 'accept', value: '', reason: '', support: null }]));
const input = () => ({ source: 'https://example.org/informe', sha256: 'a'.repeat(64), pages, reviewer: 'Revisor de prueba', suggestions, decisions: decisions() });
test('sugerencias ausentes quedan desconocidas, y las presentes conservan página y fragmento', () => {
  assert.equal(suggestions.find(s => s.field === 'title').value, 'Informe de prueba');
  assert.deepEqual(suggestions.find(s => s.field === 'species'), { field: 'species', value: null, evidence: null });
  const result = reviewExtraction(input());
  assert.equal(result.fields.find(f => f.suggestion.field === 'authors').suggestion.evidence.page, 1);
  assert.equal(result.fields.find(f => f.suggestion.field === 'species').value, null);
});
test('corregir y rechazar requiere motivo y respaldo literal de una página real', () => {
  const pending = input(); pending.decisions.method.action = 'pending';
  assert.throws(() => reviewExtraction(pending), /todos los campos/);
  const corrected = input();
  corrected.decisions.authors = { action: 'correct', value: 'Persona Uno (autor de prueba)', reason: 'Identificación contextual', support: { page: 1, section: 'Autoría', quote: 'Autores: Persona Uno' } };
  assert.equal(reviewExtraction(corrected).fields.find(f => f.suggestion.field === 'authors').value, 'Persona Uno (autor de prueba)');
  corrected.decisions.authors.support.page = 2;
  assert.throws(() => reviewExtraction(corrected), /fragmento literal/);
  const rejected = input(); rejected.decisions.matrix = { action: 'reject', value: '', reason: 'No corresponde al alcance propuesto', support: null };
  assert.equal(reviewExtraction(rejected).fields.find(f => f.suggestion.field === 'matrix').value, null);
  rejected.decisions.matrix.reason = '';
  assert.throws(() => reviewExtraction(rejected), /motivo/);
});
test('ni respaldo inventado ni un título rechazado pasan la revisión', () => {
  const invented = input(); invented.suggestions = structuredClone(suggestions); invented.suggestions[0].evidence.quote = 'Texto ausente';
  assert.throws(() => reviewExtraction(invented), /respaldo/);
  const noTitle = input(); noTitle.decisions.title = { action: 'reject', value: '', reason: 'Título equivocado', support: null };
  assert.throws(() => reviewExtraction(noTitle), /título/);
});
test('límites: vacío, formato, UTF-8, tamaño y documento ilegible; TXT preserva páginas y huella', async () => {
  for (const file of [new File([], 'vacio.txt'), new File(['contenido'.repeat(10)], 'otro.docx'), new File([new Uint8Array([0xff, 0xfe])], 'mal.txt'), new File(['x'.repeat(8 * 1024 * 1024 + 1)], 'grande.txt'), new File(['hola'], 'corto.txt')]) await assert.rejects(readDocument(file));
  const result = await readDocument(new File([text + '\fPágina dos con texto de prueba suficiente.'], 'prueba.txt'));
  assert.equal(result.pages.length, 2);
  assert.equal(result.pages[1].page, 2);
  assert.match(result.sha256, /^[a-f0-9]{64}$/);
});
