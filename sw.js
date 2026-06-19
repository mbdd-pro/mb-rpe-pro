const CACHE_NAME = 'mb-rpe-pro-v1-2-6-sessioncard-scope-time';

// App shell: NO incluimos js/config.js para que los cambios de API_URL/version no queden clavados.
const APP_SHELL = [
  './','index.html','manifest.json',
  'css/base.css','css/themes.css','css/layout.css','css/components.css',
  'js/utils.js','js/storage.js','js/api.js','js/auth.js','js/charts.js','js/router.js','js/app.js',
  'js/views/login.js','js/views/register.js','js/views/athlete-home.js','js/views/athlete-stats.js',
  'js/views/coach-dashboard.js','js/views/coach-sessions.js','js/views/coach-players.js','js/views/coach-graphs.js','js/views/coach-compare.js',
  'assets/logo/icon-192.png','assets/logo/icon-512.png','assets/logo/brand-dark-192.png','assets/logo/brand-dark-512.png','assets/logo/brand-clean-192.png','assets/logo/brand-clean-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // No tocar API ni dominios externos. El Worker/Apps Script nunca deben ir a Cache Storage.
  if (url.origin !== self.location.origin) return;

  // config.js siempre network-first/no-store. Si cambia API_URL o VERSION, Chrome no debe servir una copia vieja.
  if (url.pathname.endsWith('/js/config.js')) {
    event.respondWith(
      fetch(req, { cache: 'no-store' }).catch(() => new Response("window.APP_CONFIG={APP_NAME:'MB RPE Pro',API_URL:'https://mb-rpe-pro-api.archivosmatiburrieza.workers.dev/',VERSION:'1.2.6',DEFAULT_THEME:'black',BRAND_BY:'By Pancko'};", {
        headers: { 'Content-Type': 'application/javascript; charset=utf-8' }
      }))
    );
    return;
  }

  // HTML network-first para levantar rápido nuevas versiones.
  if (req.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('/index.html')) {
    event.respondWith(
      fetch(req, { cache: 'no-store' })
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req).then(res => res || caches.match('./')))
    );
    return;
  }

  // v1.2.5: JS/CSS network-first para evitar que quede lógica vieja con versión nueva.
  if (url.pathname.endsWith('.js') || url.pathname.endsWith('.css')) {
    event.respondWith(
      fetch(req, { cache: 'no-store' })
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // Assets: cache-first con actualización en segundo plano.
  event.respondWith(
    caches.match(req).then(cached => {
      const fresh = fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => cached);
      return cached || fresh;
    })
  );
});
