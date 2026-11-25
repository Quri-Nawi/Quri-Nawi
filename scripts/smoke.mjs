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
console.log("Portada, API pública, ruta de estado y PWA verificadas.");
