/* BrightAce V66 — fast navigation service worker.
 * Same-origin only. Apps Script /exec is cross-origin and is never cached here.
 */
const BA_SW_VERSION='brightace-v66-runtime-20261007-clientdata2';
const BA_STATIC_CACHE=BA_SW_VERSION+'-static';
const BA_PAGE_CACHE=BA_SW_VERSION+'-pages';
self.addEventListener('install',event=>{event.waitUntil(caches.open(BA_STATIC_CACHE).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('brightace-')&&!k.startsWith(BA_SW_VERSION)).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
function sameOrigin(req){try{return new URL(req.url).origin===self.location.origin}catch(e){return false}}
function isPage(req){try{return sameOrigin(req)&&(req.mode==='navigate'||req.destination==='document'||/\.html(?:$|[?#])/i.test(new URL(req.url).pathname))}catch(e){return false}}
function isStatic(req){return ['script','style','image','font'].includes(req.destination)&&sameOrigin(req)}
async function staleWhileRevalidate(req,cacheName){
  const cache=await caches.open(cacheName),cached=await cache.match(req);
  const network=fetch(req).then(r=>{if(r&&r.ok)cache.put(req,r.clone());return r}).catch(()=>null);
  return cached||await network||new Response('BrightAce is temporarily offline.',{status:503,headers:{'Content-Type':'text/plain'}});
}
self.addEventListener('fetch',event=>{
  const req=event.request;if(req.method!=='GET'||!sameOrigin(req))return;
  if(isPage(req)){event.respondWith(staleWhileRevalidate(req,BA_PAGE_CACHE));return}
  if(isStatic(req)){event.respondWith(caches.open(BA_STATIC_CACHE).then(async cache=>{const hit=await cache.match(req);if(hit)return hit;const r=await fetch(req);if(r&&r.ok)cache.put(req,r.clone());return r}));}
});
