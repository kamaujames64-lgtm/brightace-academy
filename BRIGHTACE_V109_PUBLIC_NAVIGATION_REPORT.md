# BrightAce Academy V109 — Public Navigation Reliability

## Issue addressed
Public navigation sometimes rendered an incomplete/unstyled-looking destination until refresh, and users sometimes received GitHub Pages' generic 404 page.

## Root cause addressed
The V108.1 public speed engine intercepted ordinary links, fetched the destination document, and replaced only its `<main>` element. That bypasses the browser's normal full-document initialization and does not execute destination page scripts. This is not a safe general navigation strategy for pages that rely on page-specific scripts/styles or body-level initialization.

## Changes
- `js/brightace-speed-engine.js` — public soft-navigation interception is disabled by default; click handler now exits without preventing the browser's normal navigation. Prefetching and performance hints remain available.
- `sw.js` — cache namespace bumped to `brightace-perf-20261030-v109-public-navigation-fix` so previous page/static caches are retired.
- `index.html` — speed-engine stylesheet/script references bumped to v1.0.2.
- `pages/subjects.html`
- `pages/resources.html`
- `pages/homework-help.html`
- `pages/how-it-works.html`
- `pages/about.html`
- `pages/faq.html`
- `pages/contact.html`
- `pages/privacy.html`
- `pages/terms.html` — public speed-engine asset query versions bumped to v1.0.2.
- `.nojekyll` — added GitHub Pages marker to disable Jekyll processing of static repository files.
- `404.html` — added a branded fallback page with a link to the site homepage.
- `tools/brightace-v109-public-navigation-test.js` — new navigation/cache/local-link regression test.
- `tools/brightace-v105-workspace-regression-test.js`, `tools/brightace-v106-session-workflow-test.js`, `tools/brightace-v107-client-history-performance-test.js`, `tools/brightace-v108-repair-test.js` — updated expected service-worker namespace; V105 test also checks that public soft navigation is disabled.
- `README.md` — added V109 deployment notes.

## Verification
- V109 public navigation and local public-link audit: passed.
- V105 workspace regression suite: 18/18 passed.
- V106 session/workflow suite: 17/17 passed.
- V107 client-history/performance suite: 15/15 passed.
- V108 repair suite: 13/13 passed.
- V108.1 tutoring job selection suite: 7/7 passed.
- JavaScript syntax check for `js/brightace-speed-engine.js`: passed.
- ZIP integrity check: performed after packaging.

These are source-level regression checks, not a live-browser test against the published GitHub Pages deployment. The fix takes effect only after the updated package is deployed to the repository's GitHub Pages source.
