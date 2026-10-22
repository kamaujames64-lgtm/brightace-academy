# BrightAce Academy — Speed, Smooth Navigation & 3,000-User Readiness

Date: 2026-10-22
Base: supplied V95 repaired website package

## Changes made in this pass

- Updated `sw.js` to use a new `brightace-perf-20261022-v95-smooth-navigation` cache namespace.
- Changed same-origin static HTML navigation from network-first (up to an 8-second wait) to stale-while-revalidate. If the document is already cached, it is returned immediately while the worker fetches a newer copy in the background. The page is not force-reloaded when the cache updates.
- Reduced the first-visit document fetch timeout from 8 seconds to 5 seconds. On first visit, a slow/unavailable network can still delay navigation up to this timeout; an offline fallback is returned if no cached document exists.
- Kept API calls out of service-worker caching. Cross-origin Apps Script/Render API calls are not cached by this worker, avoiding accidental caching of authenticated or private API responses.
- Updated the regression tests to recognize the new cache namespace.

## Tests run in this pass

- `node tools/brightace-v92-fetch-recovery-test.js`: 15/15 passed.
- `node tools/brightace-load-test.js 100 1`: 800 local static-file requests, 0 failures; local run elapsed 0.53 seconds, p50 7.5 ms, p95 312.5 ms, p99 421.5 ms. These numbers measure a local Node static-file harness, not GitHub Pages or Apps Script production latency.
- `node tools/brightace-regression-test.js`: 5/5 passed.
- `node tools/brightace-security-test.js`: 11/11 source checks passed. One check notes public Drive link-sharing compatibility remains in the existing source; private delivery paths need authenticated access review.
- Initial `node tools/brightace-v88-resource-test.js` run had one expected version assertion failure because the service-worker version was intentionally advanced. Updated that assertion to V95; rerun result is recorded in the delivery summary.

## Known limits and remaining work

This is a source-package optimization, not a deployment. The change takes effect only after publishing the updated static files. Browser service-worker caching also depends on users visiting the updated deployment and the browser accepting the new worker.

The static host is GitHub Pages and the backend includes Google Apps Script / Google Sheets. The most important scaling risks are Apps Script quotas and execution time, repeated full-sheet reads, script-lock contention on writes, session storage in Script Properties, and polling traffic. The local static test cannot validate any of those backend limits.

A safe 3,000-concurrent-user assessment requires a dedicated staging Apps Script deployment, isolated test spreadsheet, synthetic accounts, and gradual load ramps. Do not run a 3,000-user test against production: it could consume quotas, serialize writes, or disrupt real users. Measure API P50/P95/P99, error rate, Apps Script execution time/quota exceptions, lock wait time, cache hit rate, sheet rows scanned, and polling request rate. Test reads and writes separately, then realistic mixed traffic.

## Recommended architecture before a 3,000-user production claim

1. Keep GitHub Pages/CDN for static frontend assets, with versioned asset names and long-lived immutable caching for hashed assets.
2. Move hot transactional data and session state from Google Sheets/Script Properties to a database and API designed for concurrent indexed queries and atomic writes. Keep Sheets for reporting/admin exports rather than request-time scans.
3. Replace global script-lock contention with database transactions or narrowly scoped locks; make payment/webhook and completion actions idempotent.
4. Replace frequent per-user chat polling with push/realtime delivery or adaptive long polling; pause polling in hidden tabs and add jitter/backoff.
5. Enforce authentication and role/ownership checks server-side for every protected API action. Use deny-by-default admin permissions and authenticated private-file delivery.
6. Add structured error IDs, request timeouts, retry only safe/idempotent requests, exponential backoff with jitter, and clear user-facing recovery that preserves form state.
7. Establish staging load-test gates and alerts before production rollout.

## Deployment checklist

- Back up the current published site and current Apps Script deployment.
- Publish the updated static package to the existing GitHub Pages source.
- Verify in Chrome DevTools that the new `sw.js` is installed and that repeat navigation uses cached HTML without a forced reload.
- Test client, tutor, and admin login/logout with authorized test accounts; verify no-token, invalid-token, expired-token, and wrong-role API calls return no protected data.
- Confirm no private API responses or authenticated documents are stored in Cache Storage.
- Capture real Network errors for any `Failed to fetch` occurrence before changing API endpoint/CORS/session logic.
- Do not claim 3,000-user capacity until the isolated staging ramp and realistic mixed-workload test pass with agreed latency/error budgets.
