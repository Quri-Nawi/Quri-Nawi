/* global self, caches, fetch, URL, Response */
const CACHE = "curinawi-public-v1";
const shellFiles = [
  "/manifest.webmanifest",
  "/brand/curinawi.png",
  "/brand/app-192.png",
  "/brand/app-512.png",
  "/brand/gold-for-good.svg",
  "/images/cuenca-del-beni.jpg",
  "/fonts/inter.woff2",
  "/fonts/space-grotesk.woff2",
];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const home = await fetch("/", { cache: "reload" });
    if (!home.ok) throw new Error("La portada no está disponible");
    const html = await home.clone().text();
    const chunks = [...html.matchAll(/(?:src|href)="(\/_next\/static\/[^"]+)"/g)].map((match) => match[1]);
    await cache.addAll([...new Set([...shellFiles, ...chunks])]);
    await cache.put("/", home);
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith("curinawi-public-") && key !== CACHE) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  const isHome = request.mode === "navigate" && url.pathname === "/";
  const isAsset = url.pathname.startsWith("/_next/static/") || shellFiles.includes(url.pathname);
  if (!isHome && !isAsset) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    if (isAsset) {
      const cached = await cache.match(request);
      if (cached) return cached;
    }
    try {
      const response = await fetch(request);
      if (response.ok) await cache.put(isHome ? "/" : request, response.clone());
      if (isHome && response.status >= 500) return (await cache.match("/")) ?? response;
      return response;
    } catch {
      return (await cache.match(isHome ? "/" : request)) ?? new Response("Curinawi no está disponible sin conexión.", { status: 503 });
    }
  })());
});
