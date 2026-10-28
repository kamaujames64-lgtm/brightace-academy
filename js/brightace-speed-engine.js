/* BrightAce Supersonic Speed Engine v1.0
 * Dependency-free progressive enhancement for the BrightAce static frontend.
 * No API responses, authenticated pages, or private data are cached by this script.
 */
(function () {
  'use strict';
  if (window.__BA_SPEED_ENGINE_V1__) return;
  window.__BA_SPEED_ENGINE_V1__ = true;

  var cfg = Object.assign({
    prefetch: true,
    softNavigation: true,
    diagnostics: false,
    maxPrefetches: 24,
    prefetchDelayMs: 75,
    excludedPath: /\/(?:admin(?:-[^/]+)?|client-[^/]+|tutor(?:-[^/]+)?|chat|payment|resource-checkout|resource-media|receipt|verify-statement)(?:\.html)?$/i
  }, window.BRIGHTACE_SPEED_CONFIG || {});

  var root = document.querySelector('main');
  var prefetched = new Set();
  var inFlight = new Map();
  var prefetchCount = 0;
  var currentNav = 0;
  var progress = null;
  var perf = { startedAt: performance.now(), nav: null, vitals: {} };

  function log() {
    if (cfg.diagnostics && window.console) console.info.apply(console, ['[BrightAce Speed]'].concat([].slice.call(arguments)));
  }
  function sameOrigin(url) { return url.origin === window.location.origin; }
  function isExcluded(url) { return cfg.excludedPath.test(url.pathname); }
  function isHtmlLink(anchor) {
    if (!anchor || !anchor.href || anchor.hasAttribute('download') || anchor.target && anchor.target !== '_self') return false;
    if (anchor.hasAttribute('data-no-prefetch') || anchor.hasAttribute('data-no-soft-nav')) return false;
    if (anchor.getAttribute('rel') === 'external') return false;
    try {
      var url = new URL(anchor.href, location.href);
      return sameOrigin(url) && /^https?:$/.test(url.protocol) && !isExcluded(url) &&
        !url.hash && (url.pathname.endsWith('.html') || url.pathname.endsWith('/') || !url.pathname.split('/').pop().includes('.'));
    } catch (_) { return false; }
  }
  function canonicalUrl(input) {
    var u = new URL(input, location.href);
    u.hash = '';
    return u.href;
  }
  function addHints() {
    var api = window.BRIGHTACE_API_URL;
    if (api) {
      try {
        var origin = new URL(api).origin;
        if (origin !== location.origin && !document.querySelector('link[data-ba-api-preconnect]')) {
          var hint = document.createElement('link');
          hint.rel = 'preconnect'; hint.href = origin; hint.crossOrigin = 'anonymous'; hint.dataset.baApiPreconnect = '1';
          document.head.appendChild(hint);
          var dns = document.createElement('link'); dns.rel = 'dns-prefetch'; dns.href = origin;
          document.head.appendChild(dns);
        }
      } catch (_) { /* Ignore malformed optional API config. */ }
    }
    var hero = document.querySelector('.hero img, img.hero-logo, .brand img');
    if (hero) {
      hero.decoding = 'async';
      if (hero.getBoundingClientRect().top < innerHeight) hero.fetchPriority = 'high';
    }
  }
  function optimizeImages() {
    var images = document.images;
    for (var i = 0; i < images.length; i++) {
      var img = images[i];
      if (!img.hasAttribute('decoding')) img.decoding = 'async';
      if (img.hasAttribute('loading')) continue;
      var rect = img.getBoundingClientRect();
      var likelyHero = rect.top < innerHeight * 1.25 || img.classList.contains('hero-logo') || img.closest('.brand');
      if (!likelyHero) img.loading = 'lazy';
    }
  }
  function prefetch(anchor) {
    if (!cfg.prefetch || prefetchCount >= cfg.maxPrefetches || !isHtmlLink(anchor)) return;
    var url = canonicalUrl(anchor.href);
    if (prefetched.has(url) || inFlight.has(url)) return;
    prefetched.add(url); prefetchCount++;
    var promise = fetch(url, { method: 'GET', credentials: 'same-origin', cache: 'force-cache', headers: { 'X-BA-Prefetch': '1' } })
      .then(function (r) { if (!r.ok || !/text\/html/i.test(r.headers.get('content-type') || '')) throw new Error('not-cacheable'); return r.arrayBuffer(); })
      .then(function () { log('prefetched', url); })
      .catch(function () { prefetched.delete(url); })
      .finally(function () { inFlight.delete(url); });
    inFlight.set(url, promise);
  }
  var hoverTimer = null;
  document.addEventListener('pointerover', function (event) {
    var a = event.target && event.target.closest ? event.target.closest('a[href]') : null;
    if (!a || !isHtmlLink(a)) return;
    if (hoverTimer) clearTimeout(hoverTimer);
    hoverTimer = setTimeout(function () { prefetch(a); }, cfg.prefetchDelayMs);
  }, { passive: true });
  document.addEventListener('focusin', function (event) {
    var a = event.target && event.target.closest ? event.target.closest('a[href]') : null;
    if (a) prefetch(a);
  });

  function ensureProgress() {
    if (progress) return progress;
    progress = document.createElement('div');
    progress.className = 'ba-speed-progress';
    progress.setAttribute('aria-hidden', 'true');
    document.body.appendChild(progress);
    return progress;
  }
  function setProgress(state) {
    var el = ensureProgress();
    el.classList.remove('is-loading', 'is-done');
    if (state) el.classList.add(state);
  }
  function pageIsSafeForSoftNavigation(doc, url) {
    if (!cfg.softNavigation || !root || !doc.querySelector('main')) return false;
    if (isExcluded(url) || isExcluded(new URL(location.href))) return false;
    // Reinitializing inline application code can break authentication and page state.
    // If executable scripts are inside main, use normal browser navigation instead.
    var destinationMain = doc.querySelector('main');
    if (destinationMain.querySelector('script:not([type="application/ld+json"])')) return false;
    if (root.querySelector('form, iframe, video, audio')) return false;
    if (destinationMain.querySelector('form, iframe, video, audio')) return false;
    if (doc.querySelector('meta[http-equiv="refresh"]')) return false;
    return true;
  }
  function syncDocument(doc, url) {
    var nextMain = doc.querySelector('main');
    if (!nextMain || !root) return false;
    root.replaceWith(nextMain);
    root = nextMain;
    document.title = doc.title || document.title;
    // Public pages can have page-specific inline CSS. Keep the stylesheets in
    // sync too, otherwise a soft navigation could render the new page unstyled.
    document.head.querySelectorAll('link[rel="stylesheet"],style').forEach(function (node) { node.remove(); });
    doc.head.querySelectorAll('link[rel="stylesheet"],style').forEach(function (node) { document.head.appendChild(node.cloneNode(true)); });
    var description = doc.querySelector('meta[name="description"]');
    var currentDescription = document.querySelector('meta[name="description"]');
    if (description && currentDescription) currentDescription.content = description.content;
    else if (description) { var m = description.cloneNode(true); document.head.appendChild(m); }
    var canonical = doc.querySelector('link[rel="canonical"]');
    var currentCanonical = document.querySelector('link[rel="canonical"]');
    if (canonical && currentCanonical) currentCanonical.href = canonical.href;
    else if (canonical) document.head.appendChild(canonical.cloneNode(true));
    document.body.className = doc.body.className;
    document.body.dataset.baSoftNav = doc.body.dataset.baSoftNav || 'public';
    document.querySelectorAll('.nav-links a.active').forEach(function (a) { a.classList.remove('active'); });
    var newPath = url.pathname;
    document.querySelectorAll('.nav-links a[href]').forEach(function (a) {
      try { if (new URL(a.href, location.href).pathname === newPath) a.classList.add('active'); } catch (_) {}
    });
    optimizeImages();
    window.dispatchEvent(new CustomEvent('ba:soft-navigation', { detail: { url: url.href } }));
    return true;
  }
  async function navigate(url, push) {
    var id = ++currentNav;
    setProgress('is-loading');
    var started = performance.now();
    try {
      var response = await fetch(url.href, { credentials: 'same-origin', cache: 'no-cache', headers: { 'X-BA-Soft-Navigation': '1' } });
      if (!response.ok || !/text\/html/i.test(response.headers.get('content-type') || '')) throw new Error('HTTP response not suitable for soft navigation');
      var html = await response.text();
      if (id !== currentNav) return;
      var doc = new DOMParser().parseFromString(html, 'text/html');
      if (!pageIsSafeForSoftNavigation(doc, url)) throw new Error('Page needs full browser navigation for safe initialization');
      if (!syncDocument(doc, url)) throw new Error('No main content');
      if (push) history.pushState({ baSoftNavigation: true }, '', url.href);
      window.scrollTo({ top: 0, left: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'instant' });
      perf.vitals.lastSoftNavigationMs = Math.round(performance.now() - started);
      log('soft navigation', url.href, perf.vitals.lastSoftNavigationMs + 'ms');
    } catch (err) {
      log('using normal navigation', err && err.message);
      if (push) location.href = url.href;
      else location.reload();
      return;
    } finally {
      if (id === currentNav) setProgress('is-done');
    }
  }
  document.addEventListener('click', function (event) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    var a = event.target && event.target.closest ? event.target.closest('a[href]') : null;
    if (!a || !isHtmlLink(a) || a.hasAttribute('data-no-soft-nav')) return;
    var url = new URL(a.href, location.href);
    if (url.pathname === location.pathname && url.search === location.search) return;
    if (!root || root.querySelector('form, iframe, video, audio')) return;
    // Only opt into soft navigation on pages explicitly marked public and safe.
    if (document.body.dataset.baSoftNav !== 'public') return;
    event.preventDefault();
    navigate(url, true);
  });
  window.addEventListener('popstate', function (event) {
    if (document.body.dataset.baSoftNav === 'public' && event.state && event.state.baSoftNavigation) navigate(new URL(location.href), false);
    else if (document.body.dataset.baSoftNav === 'public') navigate(new URL(location.href), false);
  });

  function collectNavigationTiming() {
    var entries = performance.getEntriesByType('navigation');
    if (!entries.length) return;
    var n = entries[0];
    perf.nav = {
      dnsMs: Math.round(n.domainLookupEnd - n.domainLookupStart),
      connectMs: Math.round(n.connectEnd - n.connectStart),
      ttfbMs: Math.round(n.responseStart - n.requestStart),
      downloadMs: Math.round(n.responseEnd - n.responseStart),
      domInteractiveMs: Math.round(n.domInteractive),
      domContentLoadedMs: Math.round(n.domContentLoadedEventEnd),
      loadEventMs: Math.round(n.loadEventEnd)
    };
    if (cfg.diagnostics) console.info('[BrightAce Speed] navigation timing', perf.nav);
  }
  function setupVitals() {
    if (!('PerformanceObserver' in window)) return;
    try {
      new PerformanceObserver(function (list) {
        var entries = list.getEntries(); if (entries.length) perf.vitals.lcpMs = Math.round(entries[entries.length - 1].startTime);
      }).observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (_) {}
    try {
      new PerformanceObserver(function (list) {
        list.getEntries().forEach(function (e) { if (!e.hadRecentInput) perf.vitals.cls = (perf.vitals.cls || 0) + e.value; });
      }).observe({ type: 'layout-shift', buffered: true });
    } catch (_) {}
    try {
      new PerformanceObserver(function (list) {
        list.getEntries().forEach(function (e) { perf.vitals.inpCandidateMs = Math.max(perf.vitals.inpCandidateMs || 0, e.duration || 0); });
      }).observe({ type: 'event', buffered: true, durationThreshold: 40 });
    } catch (_) {}
  }
  window.BrightAceSpeed = {
    version: '1.0.0',
    report: function () { collectNavigationTiming(); return JSON.parse(JSON.stringify({ version: '1.0.0', navigation: perf.nav, vitals: perf.vitals, prefetchedPages: prefetched.size })); },
    prefetch: function (href) { try { var a = document.createElement('a'); a.href = new URL(href, location.href).href; prefetch(a); } catch (_) {} }
  };
  addHints();
  optimizeImages();
  setupVitals();
  if (document.readyState === 'complete') collectNavigationTiming();
  else window.addEventListener('load', collectNavigationTiming, { once: true });
  log('initialized', window.BrightAceSpeed.version);
})();
