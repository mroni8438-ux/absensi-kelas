const CACHE_NAME = 'absensi-kelas-cache-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/masuk',
  '/offline',
  '/offline.html',
  '/favicon.svg',
  '/manifest.webmanifest',
  '/latar/latar-lebar.jpg',
  '/latar/latar-tinggi.jpg',
  '/aset-pwa/ikon-192.svg',
  '/aset-pwa/ikon-512.svg',
  '/logo/simbol.svg',
  '/logo/logo-horizontal.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Hanya tangani permintaan GET
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Jangan pernah cache permintaan API Supabase / Edge Functions
  if (url.hostname.includes('supabase.co') || url.pathname.startsWith('/api/')) {
    return;
  }

  // Permintaan Navigasi Halaman Web
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/offline.html') || caches.match('/offline');
      })
    );
    return;
  }

  // Aset Statis (Cache Dulu, Perbarui di Latar — K7)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => cachedResponse || Response.error());

      return cachedResponse || fetchPromise;
    })
  );
});

