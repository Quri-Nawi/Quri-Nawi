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
console.log("Portada y ruta de estado verificadas.");
