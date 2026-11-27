import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseDraft, proposalCall, sendProposal, sourceUrl } from '../src/lib/proposals.ts';

const draft = { title: 'Estudio de prueba', url: 'https://example.org/estudio', territory: 'Kaka' };
const receipt = { id: 'p_0123456789abcdef0123', estado: 'pendiente_revision', duplicado: false };
const response = proposal => Response.json({ id: 'quri-propuesta', result: { structuredContent: { propuesta: proposal } } });
test('DOI y su URL se normalizan; credenciales y protocolos inseguros se rechazan', () => {
  assert.equal(sourceUrl('10.1234/ABC'), sourceUrl('https://dx.doi.org/10.1234/abc/?tracking=x#z'));
  assert.throws(() => sourceUrl('http://example.org'));
  assert.throws(() => sourceUrl('https://user:password@example.org'));
  assert.throws(() => parseDraft({ ...draft, territory: 'No existe' }));
});
test('envía una referencia y solo confirma ID D1 validado; el reintento conserva ID', async () => {
  const call = proposalCall(draft);
  assert.equal(call.params.name, 'proponer_candidato');
  assert.ok(call.params.arguments.motivo.length <= 1000);
  const fetcher = async (url, options) => {
    assert.equal(new URL(url).pathname, '/mcp');
    assert.equal(options.headers['MCP-Protocol-Version'], '2025-11-25');
    assert.equal(options.headers.Authorization, undefined);
    assert.deepEqual(JSON.parse(options.body), call);
    return response(receipt);
  };
  assert.deepEqual(await sendProposal(draft, fetcher), receipt);
  assert.equal((await sendProposal(draft, async () => response({ ...receipt, duplicado: true }))).id, receipt.id);
});
test('timeout, error de herramienta, estado o ID no confirmados no simulan almacenamiento', async () => {
  for (const fetcher of [async () => { throw new Error('timeout'); }, async () => new Response('', { status: 503 }), async () => Response.json({ id: 'quri-propuesta', result: { isError: true, structuredContent: { propuesta: receipt } } }), async () => response({ ...receipt, id: 'p001' }), async () => response({ ...receipt, estado: 'preparada' })]) await assert.rejects(sendProposal(draft, fetcher));
});
