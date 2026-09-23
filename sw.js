/* ============================================================
 *  MHC Smart School — Service Worker (PWA & Offline Cache)
 *  Version: 2.6.3
 *  Strategy: Network-First for App Code, Cache-First for Assets
 * ============================================================ */

const CACHE_NAME = 'mhc-smart-school-v2.6.3';

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

// Install: Pre-cache core application shell & activate immediately
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

// Activate: Clean up previous version caches immediately
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('Purging outdated cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Network-First for JS/CSS/HTML app code, Cache-First for static icons/fonts
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // 1. Bypass Service Worker for API calls and non-GET requests
  if (req.method !== 'GET' || url.hostname.includes('script.google.com') || url.hostname.includes('script.googleusercontent.com')) {
    return;
  }

  const isAppCode = url.origin === self.location.origin && 
    (url.pathname.endsWith('.js') || url.pathname.endsWith('.css') || url.pathname.endsWith('.html') || url.pathname.endsWith('/'));

  if (isAppCode) {
    // Network-First: Always fetch latest version when online so updates apply immediately
    event.respondWith(
      fetch(req).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
          const resClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, resClone));
        }
        return networkResponse;
      }).catch(() => {
        return caches.match(req);
      })
    );
    return;
  }

  // 2. Cache-First for static media/assets/CDNs
  event.respondWith(
    caches.match(req).then(cachedResponse => {
      if (cachedResponse) return cachedResponse;
      return fetch(req).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
          const resClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, resClone));
        }
        return networkResponse;
      }).catch(err => {
        console.warn('Fetch fallback failed:', err);
      });
    })
  );
});
