import { test } from 'node:test';
import assert from 'node:assert/strict';
import { seedRecords } from '../src/lib/catalog.ts';
import { validatePublication, publicPublications } from '../src/lib/review.ts';

// Expediente sintético para probar el procedimiento. No es una revisión de una ficha real.
const fixture = () => ({ proposalId: 'p_0123456789abcdef0123', state: 'publicado', version: 1, record: { ...structuredClone(seedRecords[0]), id: 'ejemplo-prueba' }, metadata: { authors: 'Desconocido', section: 'Sección de prueba', method: 'Desconocido', species: 'No aplica', analyte: 'Mercurio' }, permission: { public: true, basis: 'Autorización sintética para prueba', precision: 'generalizada', expires: null }, review: { reviewer: 'Persona de prueba', date: '2026-11-26', decision: 'aprobar', reason: 'Caso sintético', scientific: 'pendiente' }, history: [{ version: 1, date: '2026-11-26', reviewer: 'Persona de prueba', reason: 'Caso sintético' }] });
test('propuesta → revisión → publicación preserva ID, versión y revisión', () => {
  const pending = { ...fixture(), state: 'pendiente_revision', review: null };
  assert.deepEqual(publicPublications([pending]), []);
  const approved = fixture();
  validatePublication(approved);
  const [published] = publicPublications([pending, approved]);
  assert.equal(published.proposalId, pending.proposalId);
  assert.equal(published.record.id, approved.record.id);
  assert.equal(published.review.scientific, 'pendiente');
});
test('rechazo, permiso ausente/vencido, historial inválido y campos privados nunca se publican', () => {
  const variants = [p => { p.review.decision = 'rechazar'; }, p => { p.permission.public = false; }, p => { p.permission.expires = '2020-01-01'; }, p => { p.version = 2; }, p => { p.record.privateNotes = 'secreto'; }, p => { p.review.token = 'secreto'; }, p => { p.record.places[0].participant = 'privado'; }, p => { p.metadata.section = ''; }];
  for (const mutate of variants) {
    const p = fixture(); mutate(p);
    assert.deepEqual(publicPublications([p], '2026-11-26'), []);
  }
});
test('el catálogo vigente no inventa aprobación para las semillas', async () => {
  const { reviewedPublications, records } = await import('../src/lib/catalog.ts');
  assert.ok(seedRecords.every(seed => !reviewedPublications.some(p => p.record.id === seed.id)));
  assert.equal(records.length, seedRecords.length + reviewedPublications.length);
});
