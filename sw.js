const CACHE='lingualens-v2';
const ASSETS=['./', './index.html'];

self.addEventListener('install',function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(ASSETS);}));
  self.skipWaiting();
});
self.addEventListener('activate',function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){return k!==CACHE;}).map(function(k){return caches.delete(k);}));
  }));
  self.clients.claim();
});
self.addEventListener('fetch',function(e){
  if(e.request.url.includes('api.')||e.request.url.includes('groq.')||e.request.url.includes('mymemory')||e.request.url.includes('ocr.space')){
    e.respondWith(fetch(e.request).catch(function(){return new Response('offline',{status:503});}));
    return;
  }
  e.respondWith(
    caches.match(e.request).then(function(cached){
      return cached||fetch(e.request).then(function(res){
        if(res.ok){var clone=res.clone();caches.open(CACHE).then(function(c){c.put(e.request,clone);});}
        return res;
      }).catch(function(){return cached||new Response('offline',{status:503});});
    })
  );
});

/* إشعارات SRS */
self.addEventListener('notificationclick',function(e){
  e.notification.close();
  e.waitUntil(clients.matchAll({type:'window'}).then(function(cs){
    for(var i=0;i<cs.length;i++){if(cs[i].url.includes('lingualens')){cs[i].focus();return;}}
    return clients.openWindow('./');
  }));
});

// استقبال رسالة لجدولة إشعار
self.addEventListener('message',function(e){
  if(e.data&&e.data.type==='SCHEDULE_NOTIF'){
    var data=e.data;
    // إشعار فوري للاختبار أو مجدول
    self.registration.showNotification('📅 LinguaLens — مراجعة يومية',{
      body:data.body||'لديك كلمات تنتظر المراجعة اليوم!',
      icon:'./icon-192.png',
      badge:'./icon-192.png',
      tag:'srs-daily',
      renotify:true,
      data:{url:'./'},
      actions:[
        {action:'review',title:'📚 مراجعة الآن'},
        {action:'later', title:'⏰ لاحقاً'}
      ]
    });
  }
});
