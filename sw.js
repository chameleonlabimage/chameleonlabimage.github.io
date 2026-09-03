// Soporte offline automático para GitHub Pages
const CACHE_NAME = 'pwa-arte-v1';

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(clients.claim());
});

self.addEventListener('fetch', (e) => {
  // Estrategia: Intentar cargar de red, si falla usar caché (útil si está offline)
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});