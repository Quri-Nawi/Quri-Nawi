import assert from "node:assert/strict";

const origin = new URL(process.env.QURI_SMOKE_URL ?? "http://localhost:3000");
const options = { signal: AbortSignal.timeout(10_000) };
const home = await fetch(new URL("/", origin), options);
assert.equal(home.status, 200);
assert.match(await home.text(), /Quri-Ñawi/);

const health = await fetch(new URL("/api/health", origin), options);
assert.equal(health.status, 200);
assert.equal(health.headers.get("cache-control"), "no-store");
assert.deepEqual(await health.json(), { status: "ok", service: "quri-nawi" });
const catalog = await fetch(new URL("/api/catalogo", origin), options);
assert.equal(catalog.status, 200);
const dataset = await catalog.json();
assert.equal(dataset.catalog, "Quri-Ñawi");
assert.ok(dataset.records.every(({ url }) => new URL(url).protocol === "https:"));
assert.ok(dataset.records.some(({ id }) => id === "kaka-seca"));

const manifest = await fetch(new URL("/manifest.webmanifest", origin), options);
assert.equal(manifest.status, 200);
const pwa = await manifest.json();
assert.equal(pwa.name, "Quri-Ñawi");
assert.equal(pwa.display, "standalone");
assert.ok(pwa.icons.some(({ sizes }) => sizes === "512x512"));

const worker = await fetch(new URL("/sw.js", origin), options);
assert.equal(worker.status, 200);
assert.equal(worker.headers.get("cache-control"), "no-cache");
const geo = await fetch(new URL("/geo/rios.json", origin), options);
assert.equal(geo.status, 200);
const basin = await geo.json();
assert.ok(dataset.records.every(({ area }) => basin.rivers.some(({ name }) => name === area)), "cada territorio del catálogo tiene su río en el mapa 3D");
const relief = await fetch(new URL("/geo/relieve.bin", origin), options);
assert.equal((await relief.arrayBuffer()).byteLength, basin.bounds.width * basin.bounds.height * 2);
const satellite = await fetch(new URL("/geo/satelite.jpg", origin), options);
assert.equal(satellite.status, 200);
const invalidTts = await fetch(new URL("/api/quri-tts?rio=Inexistente", origin), options);
assert.equal(invalidTts.status, 400);
const kakaTts = await fetch(new URL("/api/quri-tts?rio=Kaka&v=v1", origin), options);
assert.ok(kakaTts.status === 200 || kakaTts.status === 503);
console.log("Portada, API pública, ruta de estado, síntesis Quri, PWA y datos de la cuenca 3D verificados.");
