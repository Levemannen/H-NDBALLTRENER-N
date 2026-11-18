const prefix='handball-offline:'+self.registration.scope+':';
const cacheName=prefix+'BUILD_ID';
const files=BUILD_FILES;
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(cacheName).then(cache=>cache.addAll(files.map(file=>new Request(new URL(file,self.registration.scope),{cache:'reload'})))));
});
self.addEventListener('message',event=>{if(event.data==='ACTIVATE_UPDATE')self.skipWaiting();});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith(prefix)&&key!==cacheName).slice(0,-1).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  const {request}=event;
  if(request.method!=='GET'||!request.url.startsWith(self.registration.scope))return;
  // Public roster is mutable data, never a cache-first app resource. Offline data lives in the validated workspace.
  if(new URL(request.url).pathname===new URL('rosters.json',self.registration.scope).pathname){event.respondWith(fetch(new Request(request,{cache:'no-store'})));return;}
  event.respondWith(caches.open(cacheName).then(async cache=>{
    // Keep each shell paired with its fully precached build. Check the network,
    // but do not serve a different shell before its worker has finished installation.
    if(request.mode==='navigate'){
      const shell=await cache.match(new URL('index.html',self.registration.scope));
      const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),3500);
      try{const fresh=await fetch(new Request(request,{cache:'no-store',signal:controller.signal}));
        if(fresh.ok&&(!shell||await fresh.clone().text()===await shell.clone().text()))return fresh;
        event.waitUntil(self.registration.update().catch(()=>{}));
      }catch{/* A complete cached shell remains usable offline. */}finally{clearTimeout(timeout);}
      if(shell)return shell;
    }
    const url=request.mode==='navigate'?new URL('index.html',self.registration.scope):request;
    return await cache.match(url) ?? await caches.match(url) ?? fetch(request);
  }));
});
