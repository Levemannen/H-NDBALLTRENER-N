const prefix='handball-offline:'+self.registration.scope+':';
const cacheName=prefix+'BUILD_ID';
const files=BUILD_FILES;
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(cacheName).then(cache=>cache.addAll(files.map(file=>new Request(new URL(file,self.registration.scope),{cache:'reload'})))).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith(prefix)&&key!==cacheName).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  const {request}=event;
  if(request.method!=='GET'||!request.url.startsWith(self.registration.scope))return;
  event.respondWith(caches.open(cacheName).then(async cache=>{
    const url=request.mode==='navigate'?new URL('index.html',self.registration.scope):request;
    return await cache.match(url) ?? fetch(request);
  }));
});
