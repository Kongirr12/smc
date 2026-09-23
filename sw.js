/* ============================================================
 *  MHC Smart School — Service Worker (PWA & Offline Cache)
 *  Version: 2.6.0
 *  Strategy: Stale-While-Revalidate for Static Assets
 * ============================================================ */

const CACHE_NAME = 'mhc-smart-school-v2.6.0';

const PRECACHE_ASSETS = [
  './',
  'index.html',
  'styles.css',
  'js1.js',
  'js2.js',
  'js3.js',
  'js4.js',
  'js_classroom.js',
  'js_schedule.js',
  'js_behavior.js',
  'js_student_card.js',
  'js_qr_attendance.js',
  'js_line_oa.js',
  'js_manual.js',
  'favicon.ico',
  'favicon-32.png',
  'favicon-192.png',
  'favicon-512.png',
  'apple-touch-icon.png',
  'manifest.json'
];

// Install: Pre-cache core application shell
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(PRECACHE_ASSETS).catch(err => {
        console.warn('Pre-cache partial failure:', err);
      });
    })
  );
});

// Activate: Clean up previous version caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Stale-While-Revalidate for static assets, Network-only for live API
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // 1. Bypass Service Worker for API calls and non-GET requests
  if (req.method !== 'GET' || url.hostname.includes('script.google.com') || url.hostname.includes('script.googleusercontent.com')) {
    return;
  }

  // 2. Stale-While-Revalidate for application assets and CDNs
  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(req).then(cachedResponse => {
        const fetchPromise = fetch(req)
          .then(networkResponse => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(req, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => {
            // Offline fallback
            return cachedResponse;
          });

        return cachedResponse || fetchPromise;
      });
    })
  );
});
