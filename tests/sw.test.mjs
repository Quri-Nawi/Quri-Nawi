import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../public/sw.js', import.meta.url), 'utf8');
function worker({ entries = new Map(), fetcher = async () => { throw new Error('offline'); }, addAll = async () => {} } = {}) {
  const listeners = {};
  const deleted = [];
  let skipped = false;
  const cache = { match: async key => entries.get(typeof key === 'string' ? key : key.url), put: async (key, value) => entries.set(typeof key === 'string' ? key : key.url, value), addAll };
  vm.runInNewContext(source, { URL, Response, fetch: fetcher, caches: { open: async () => cache, keys: async () => ['quri-nawi-public-v5', 'otra-app'], delete: async key => deleted.push(key) }, self: { location: { origin: 'https://demo.test' }, clients: { claim: async () => {} }, skipWaiting: async () => { skipped = true; }, addEventListener: (name, listener) => { listeners[name] = listener; } } });
  return { deleted, skipped: () => skipped, async event(name, request) { let result; listeners[name]({ request, respondWith: p => { result = p; }, waitUntil: p => { result = p; } }); return result; } };
}
const request = (path, mode = 'cors') => ({ url: 'https://demo.test' + path, method: 'GET', mode });
test('API sin red ni copia responde 503 JSON', async () => {
  const response = await worker().event('fetch', request('/api/catalogo'));
  assert.equal(response.status, 503);
  assert.match((await response.json()).error, /Sin conexión/);
});
test('API usa copia también cuando el servidor devuelve 503', async () => {
  const entries = new Map([['https://demo.test/api/catalogo', Response.json({ records: [] })]]);
  const response = await worker({ entries, fetcher: async () => new Response('', { status: 503 }) }).event('fetch', request('/api/catalogo'));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { records: [] });
});
test('navegación offline con query usa la portada y no intercepta propuestas', async () => {
  const sw = worker({ entries: new Map([['/', new Response('portada')]]) });
  assert.equal(await (await sw.event('fetch', request('/?rio=Kaka', 'navigate'))).text(), 'portada');
  assert.equal(await sw.event('fetch', request('/api/propuestas')), undefined);
});
test('no activa una instalación con APIs incompletas', async () => {
  const sw = worker({ fetcher: async () => new Response('<html></html>'), addAll: async files => { if (files.includes('/api/catalogo')) throw new Error('API no disponible'); } });
  await assert.rejects(sw.event('install'), /API no disponible/);
  assert.equal(sw.skipped(), false);
});
test('la actualización solo limpia cachés propias', async () => {
  const sw = worker();
  await sw.event('activate');
  assert.deepEqual(sw.deleted, ['quri-nawi-public-v5']);
});
