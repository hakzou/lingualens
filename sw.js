const CACHE='lingualens-v1';
const ASSETS=[
  './',
  './index.html'
];

self.addEventListener('install',function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(c){return c.addAll(ASSETS);})
  );
  self.skipWaiting();
});

self.addEventListener('activate',function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){return k!==CACHE;}).map(function(k){return caches.delete(k);}));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch',function(e){
  // للـ API calls: لا نُخزّنها
  if(e.request.url.includes('api.')||e.request.url.includes('groq.')||e.request.url.includes('mymemory')){
    e.respondWith(fetch(e.request).catch(function(){return new Response('offline',{status:503});}));
    return;
  }
  e.respondWith(
    caches.match(e.request).then(function(cached){
      return cached||fetch(e.request).then(function(res){
        if(res.ok){
          var clone=res.clone();
          caches.open(CACHE).then(function(c){c.put(e.request,clone);});
        }
        return res;
      }).catch(function(){return cached||new Response('offline',{status=503});});
    })
  );
});

// إشعارات
self.addEventListener('notificationclick',function(e){
  e.notification.close();
  e.waitUntil(clients.openWindow('./'));
});
