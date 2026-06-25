// Chef Master Pro — Service Worker
// Estrategia: network-first para todo. Solo cachea assets estáticos (íconos, css)
// para que la app pueda instalarse y abrir su "shell" incluso con mala conexión.
// Los datos (JSON vía fetch a /api/* o rutas EJS) siempre van a la red — nunca a caché,
// para que el inventario, recetas y ventas se vean siempre actualizados.

const CACHE_NAME = 'chefmasterpro-shell-v1';

const ASSETS_ESTATICOS = [
  '/manifest.json',
  '/icons/icon-72.png',
  '/icons/icon-96.png',
  '/icons/icon-128.png',
  '/icons/icon-144.png',
  '/icons/icon-152.png',
  '/icons/icon-192.png',
  '/icons/icon-384.png',
  '/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_ESTATICOS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((nombres) =>
      Promise.all(
        nombres
          .filter((nombre) => nombre !== CACHE_NAME)
          .map((nombre) => caches.delete(nombre))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Solo aplicar estrategia de caché a archivos estáticos propios (íconos, manifest)
  const esAssetEstatico = url.pathname.startsWith('/icons/') || url.pathname === '/manifest.json';

  if (!esAssetEstatico) {
    // Todo lo demás (HTML, CSS, JS, datos) siempre va a la red, sin caché.
    // Esto evita que el inventario, recetas o ventas se vean "congelados".
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cacheado) => {
      if (cacheado) return cacheado;
      return fetch(event.request).then((respuesta) => {
        const clon = respuesta.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clon));
        return respuesta;
      });
    })
  );
});
