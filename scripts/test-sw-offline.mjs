import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const handlers = new Map();
const entries = new Map();
let online = true;
const key = (request) => new URL(typeof request === "string" ? request : request.url, "https://quri.example").pathname;
const cache = {
  match: async (request) => entries.get(key(request))?.clone(),
  put: async (request, response) => { entries.set(key(request), response.clone()); },
};
const self = { location: { origin: "https://quri.example" }, addEventListener: (name, handler) => handlers.set(name, handler) };
vm.runInNewContext(readFileSync(new URL("../public/sw.js", import.meta.url), "utf8"), {
  self, caches: { open: async () => cache },
  fetch: async () => { if (!online) throw new Error("sin red"); return Response.json({ version: "2026-11-26.1", consultedAt: "2026-11-26T20:00:00Z" }); },
  URL, Response, Headers,
});
async function request(path) {
  let result;
  handlers.get("fetch")({ request: new Request("https://quri.example" + path), respondWith: (promise) => { result = promise; }, waitUntil: () => {} });
  return result;
}
const fresh = await request("/api/catalogo");
assert.equal(fresh.status, 200);
assert.ok(entries.get("/api/catalogo").headers.get("X-Quri-Cached-At"));
online = false;
const cached = await request("/api/catalogo");
assert.equal(cached.status, 200);
assert.equal(cached.headers.get("X-Quri-Copy"), "offline");
assert.equal((await cached.json()).version, "2026-11-26.1");
const absent = await request("/api/fuentes");
assert.equal(absent.status, 503);
console.log("Copia de API sin conexión con fecha y procedencia; 503 solo sin copia: verificado.");
