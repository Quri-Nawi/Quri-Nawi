import assert from "node:assert/strict";

const origin = new URL(process.env.QURI_SMOKE_URL ?? "http://localhost:3000");
const options = { signal: AbortSignal.timeout(10_000) };
const home = await fetch(new URL("/", origin), options);
assert.equal(home.status, 200);
const html = await home.text();
assert.match(html, /Quri-Ñawi/);
assert.match(html, /id="respaldo"/);
assert.match(html, /GoldnEye/);
assert.equal(home.headers.get("x-content-type-options"), "nosniff");
assert.equal(home.headers.get("x-frame-options"), "DENY");
assert.match(home.headers.get("content-security-policy") ?? "", /frame-ancestors 'none'/);
assert.ok(home.headers.get("referrer-policy"), "la portada declara su política de referencia");

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
assert.ok(dataset.records.every(({ verification, claims, limits, sourceIds }) => verification && claims.length > 0 && limits.length > 0 && sourceIds.length > 0), "cada ficha declara verificación, qué se comprobó, límites y fuentes");

assert.match(catalog.headers.get("cache-control") ?? "", /s-maxage/);

const evidence = await fetch(new URL("/api/fuentes", origin), options);
assert.equal(evidence.status, 200);
const proof = await evidence.json();
assert.equal(proof.summary.sources, proof.sources.length);
assert.equal(proof.summary.figures, proof.figures.length);
const known = new Set(proof.sources.map(({ id }) => id));
assert.ok(dataset.records.every(({ sourceIds }) => sourceIds.every((id) => known.has(id))), "toda fuente citada por una ficha existe en el registro");
assert.ok(proof.figures.every(({ safeWording }) => safeWording.length > 0), "toda cifra trae su redacción segura");

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
console.log("Portada, respaldo, API de catálogo y fuentes, ruta de estado, PWA y datos de la cuenca 3D verificados.");
