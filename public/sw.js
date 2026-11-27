/* global self, caches, fetch, URL, Response */
const CACHE = "quri-nawi-public-v7";
const shellFiles = [
  "/manifest.webmanifest",
  "/brand/quri-nawi.png",
  "/brand/app-192.png",
  "/brand/app-512.png",
  "/brand/gold-for-good.svg",
  "/geo/rios.json",
  "/geo/relieve.bin",
  "/geo/satelite.jpg",
  "/geo/normales.jpg",
  "/fonts/inter.woff2",
  "/fonts/space-grotesk.woff2",
];
// Se guardan solo si se usan: la textura de escritorio no se descarga por adelantado.
const onDemandFiles = ["/geo/satelite-hd.jpg", "/pdf.worker.min.mjs"];
// Datos públicos: se consultan en línea y, sin conexión, se usa la última copia guardada.
const dataRoutes = ["/api/catalogo", "/api/fuentes"];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const home = await fetch("/", { cache: "reload" });
    if (!home.ok) throw new Error("La portada no está disponible");
    const html = await home.clone().text();
    const chunks = [...html.matchAll(/(?:src|href)="(\/_next\/static\/[^"]+)"/g)].map((match) => match[1]);
    await cache.addAll([...new Set([...shellFiles, ...chunks])]);
    await cache.put("/", home);
    // No se anuncia preparación offline hasta tener también ambas API públicas.
    await cache.addAll(dataRoutes);
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith("quri-nawi-public-") && key !== CACHE) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  const isHome = request.mode === "navigate" && url.pathname === "/";
  const isBuilt = url.pathname.startsWith("/_next/static/");
  const isShell = shellFiles.includes(url.pathname) || onDemandFiles.includes(url.pathname);
  const isData = dataRoutes.includes(url.pathname);
  if (!isHome && !isBuilt && !isShell && !isData) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const key = isHome ? "/" : request;
    if (isBuilt) {
      // Archivos con huella en el nombre: no cambian, se sirven del caché.
      const cached = await cache.match(request);
      if (cached) return cached;
    }
    if (isShell) {
      // Archivos sin huella: se sirve la copia y se renueva en segundo plano.
      const cached = await cache.match(request);
      if (cached) {
        event.waitUntil(fetch(request).then((fresh) => { if (fresh.ok) return cache.put(request, fresh); }).catch(() => undefined));
        return cached;
      }
    }
    try {
      const response = await fetch(request);
      if (response.ok) await cache.put(key, response.clone());
      if ((isHome || isData) && response.status >= 500) return (await cache.match(key)) ?? response;
      return response;
    } catch {
      const cached = await cache.match(key);
      if (cached) return cached;
      if (isData) return new Response(JSON.stringify({ error: "Sin conexión y sin copia guardada." }), { status: 503, headers: { "Content-Type": "application/json" } });
      return new Response("Quri-Ñawi no está disponible sin conexión.", { status: 503 });
    }
  })());
});
