/* ===================================================
   LinguaLens Service Worker — v2026-1
   يُمكّن العمل بدون إنترنت وتثبيت التطبيق
   =================================================== */

const CACHE_NAME = 'lingualens-v4';
const OFFLINE_URL = './index.html';

/* الملفات التي تُخزَّن في ذاكرة التخزين المؤقت عند التثبيت */
const PRECACHE = [
  './index.html',
  './manifest.json'
];

/* ── تثبيت: خزّن الملفات الأساسية ── */
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(PRECACHE);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

/* ── تفعيل: احذف الذاكرات المؤقتة القديمة ── */
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

/* ── الاعتراض: استراتيجية Network-First مع Fallback للكاش ── */
self.addEventListener('fetch', function(event) {
  /* تجاهل طلبات غير GET */
  if (event.request.method !== 'GET') return;

  /* تجاهل طلبات APIs الخارجية (Groq, Anthropic, Google Fonts…) */
  var url = event.request.url;
  if (
    url.includes('groq.com') ||
    url.includes('anthropic.com') ||
    url.includes('googleapis.com') ||
    url.includes('responsivevoice') ||
    url.includes('tesseract') ||
    url.includes('youtube') ||
    url.startsWith('chrome-extension')
  ) {
    return; /* دع المتصفح يتعامل معها مباشرة */
  }

  event.respondWith(
    fetch(event.request)
      .then(function(response) {
        /* خزّن نسخة من الاستجابة الناجحة */
        if (response && response.status === 200 && response.type === 'basic') {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, clone);
          });
        }
        return response;
      })
      .catch(function() {
        /* لا إنترنت — ابحث في الكاش */
        return caches.match(event.request).then(function(cached) {
          if (cached) return cached;
          /* الملف الرئيسي كـ fallback */
          return caches.match(OFFLINE_URL);
        });
      })
  );
});

/* ── إشعارات التذكير بالمراجعة (SRS) ── */
self.addEventListener('message', function(event) {
  if (!event.data) return;

  if (event.data.type === 'SCHEDULE_NOTIF') {
    var body = event.data.body || 'وقت مراجعة مفرداتك! 📚';
    self.registration.showNotification('LinguaLens 🔤', {
      body: body,
      icon: './icon-192.png',
      badge: './icon-192.png',
      tag: 'srs-reminder',
      vibrate: [200, 100, 200],
      data: { url: './index.html' }
    });
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  var targetUrl = (event.notification.data && event.notification.data.url) || './index.html';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(list) {
      for (var i = 0; i < list.length; i++) {
        if (list[i].url === targetUrl && 'focus' in list[i]) {
          return list[i].focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});
