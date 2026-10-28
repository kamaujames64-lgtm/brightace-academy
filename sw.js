/* BrightAce Academy service worker — performance/reliability patch.
 * GitHub Pages is the static site host. Google Apps Script /exec and Render
 * are cross-origin APIs and are deliberately never cached by this worker.
 */
const BA_SW_VERSION = 'brightace-perf-20261028-v105-network-first-workspace-fix';
const BA_STATIC_CACHE = BA_SW_VERSION + '-static';
const BA_PAGE_CACHE = BA_SW_VERSION + '-pages';

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    await caches.open(BA_STATIC_CACHE);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter(key => /^(?:brightace-v\d+|brightace-perf)-.*-(?:static|pages)$/.test(key) && !key.startsWith(BA_SW_VERSION))
      .map(key => caches.delete(key))
    );
    await self.clients.claim();
  })());
});

function isSameOrigin(request) {
  try { return new URL(request.url).origin === self.location.origin; }
  catch (_) { return false; }
}

function isPage(request) {
  try {
    const url = new URL(request.url);
    return isSameOrigin(request) &&
      (request.mode === 'navigate' || request.destination === 'document' || /\.html$/i.test(url.pathname));
  } catch (_) { return false; }
}


// Authentication and private portal documents must always come from the network.
// Serving a stale cached shell can make protected navigation appear before the
// current OTP/session gate has run. Public static assets remain cacheable.
function isPrivateBrightAceDocument(request) {
  try {
    const u = new URL(request.url);
    if (!isSameOrigin(request)) return false;
    return /(?:^|\/)(?:pages\/)?(?:client-[^/]+|tutor-[^/]+|admin-(?!login)[^/]+|chat|payment|receipt|client-statement|resource-checkout|verify-statement)\.html$/i.test(u.pathname);
  } catch (_) { return false; }
}
function isSecurityCriticalScript(request) {
  try {
    const u = new URL(request.url);
    if (!isSameOrigin(request)) return false;
    return /\/(?:client-portal-pages|chat|brightace-api-config|admin-navigation)\.js$/i.test(u.pathname);
  } catch (_) { return false; }
}
async function networkOnly(request) {
  return fetch(request, { cache: 'no-store', credentials: 'same-origin' });
}

function isStatic(request) {
  return isSameOrigin(request) && ['script', 'style', 'image', 'font'].includes(request.destination);
}

async function networkFirstPage(request) {
  const cache = await caches.open(BA_PAGE_CACHE);
  try {
    const response = await fetch(request, { cache: 'no-store', credentials: 'same-origin' });
    if (response && response.ok && response.type === 'basic') {
      cache.put(request, response.clone()).catch(() => {});
    }
    return response;
  } catch (_) {
    const cached = await cache.match(request);
    if (cached) return cached;
    const homeUrl = new URL('index.html', self.registration.scope).href;
    const offlineHtml = '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Temporarily offline | BrightAce Academy</title><body style="font-family:system-ui,sans-serif;max-width:42rem;margin:12vh auto;padding:1.25rem;line-height:1.6"><h1>BrightAce Academy is temporarily offline</h1><p>This page could not be reached right now. Check your internet connection and try again.</p><p><a href="' + homeUrl + '">Return to the homepage</a></p></body></html>';
    return new Response(offlineHtml, { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
  }
}

async function networkFirstStatic(request) {
  const cache = await caches.open(BA_STATIC_CACHE);
  try {
    const response = await fetch(request, { cache: 'no-store' });
    if (response && response.ok && response.type === 'basic') cache.put(request, response.clone()).catch(() => {});
    return response;
  } catch (_) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw new Error('BrightAce asset unavailable and no offline copy exists.');
  }
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || !isSameOrigin(request)) return;
  if (isPrivateBrightAceDocument(request) || isSecurityCriticalScript(request)) {
    // Never return stale cached authentication code or a private portal document.
    event.respondWith(networkOnly(request));
    return;
  }
  if (isPage(request)) {
    event.respondWith(networkFirstPage(request));
    return;
  }
  if (isStatic(request)) {
    event.respondWith(networkFirstStatic(request));
  }
});
