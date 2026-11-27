import { test } from 'node:test';
import assert from 'node:assert/strict';
import { POST } from '../src/app/api/propuestas/route.ts';

const request = (body, origin = 'https://quri.test', contentType = 'application/json') => new Request('https://quri.test/api/propuestas', { method: 'POST', headers: { origin, 'Content-Type': contentType }, body: typeof body === 'string' ? body : JSON.stringify(body) });
test('ruta privada: opt-in, origen, tamaño, error de upstream y confirmación', async () => {
  const previous = process.env.QURI_PROPOSALS_ENABLED;
  const originalFetch = globalThis.fetch;
  try {
    delete process.env.QURI_PROPOSALS_ENABLED;
    assert.equal((await POST(request({}))).status, 503);
    const proxied = new Request('http://localhost:3100/api/propuestas', { method: 'POST', headers: { host: '127.0.0.1:3100', origin: 'http://127.0.0.1:3100', 'Content-Type': 'application/json' }, body: '{}' });
    assert.equal((await POST(proxied)).status, 503, 'Next puede normalizar request.url a localhost; se comprueba Host');
    process.env.QURI_PROPOSALS_ENABLED = '1';
    assert.equal((await POST(request({}, 'https://otro.test'))).status, 403);
    assert.equal((await POST(request({}, 'https://quri.test', 'text/plain'))).status, 415);
    assert.equal((await POST(request('x'.repeat(4097)))).status, 413);
    assert.equal((await POST(request({ title: 'incompleta' }))).status, 400);
    const draft = { title: 'Prueba', url: 'https://example.org/estudio', territory: 'Kaka' };
    globalThis.fetch = async () => { throw new Error('sin red'); };
    assert.equal((await POST(request(draft))).status, 502);
    globalThis.fetch = async () => Response.json({ id: 'quri-propuesta', result: { structuredContent: { propuesta: { id: 'p_0123456789abcdef0123', estado: 'pendiente_revision' } } } });
    const response = await POST(request(draft));
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal((await response.json()).id, 'p_0123456789abcdef0123');
  } finally {
    globalThis.fetch = originalFetch;
    if (previous === undefined) delete process.env.QURI_PROPOSALS_ENABLED; else process.env.QURI_PROPOSALS_ENABLED = previous;
  }
});
