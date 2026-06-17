const CACHE_NAME = 'mb-rpe-pro-v1-006';
const APP_SHELL = [
  './','index.html','manifest.json',
  'css/base.css','css/themes.css','css/layout.css','css/components.css',
  'js/config.js','js/utils.js','js/storage.js','js/api.js','js/auth.js','js/charts.js','js/router.js','js/app.js',
  'js/views/login.js','js/views/register.js','js/views/athlete-home.js','js/views/athlete-stats.js',
  'js/views/coach-dashboard.js','js/views/coach-sessions.js','js/views/coach-players.js','js/views/coach-compare.js',
  'assets/logo/icon-192.png','assets/logo/icon-512.png','assets/logo/brand-dark-192.png','assets/logo/brand-dark-512.png','assets/logo/brand-clean-192.png','assets/logo/brand-clean-512.png'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  event.respondWith(fetch(req).then(res => {
    const copy = res.clone();
    caches.open(CACHE_NAME).then(cache => cache.put(req, copy)).catch(() => {});
    return res;
  }).catch(() => caches.match(req).then(res => res || caches.match('./'))));
});
