# BrightAce Academy — V87 Interaction, Privacy and Performance Audit

Date: 2026-10-21  
Base: `BrightAce Academy — Privacy & Scalability Audit v5`

## Work completed in this package

- Added an interaction-safe client workspace refresh path. A background response that contains identical data no longer redraws the whole workspace. Changed data is queued while the client is typing, editing a form, scrolling, or actively interacting; when applied, the code preserves the current scroll position.
- Updated the shared scheduler to pause polling in hidden tabs, prevent overlapping refreshes, stagger requests with jitter, and defer refresh while the user is interacting. A single shared activity listener avoids one listener set being added for every polling task.
- Increased chat polling from 5 seconds to 10 seconds for clients and to 12 seconds for tutor/admin tutor-message screens; the selected admin conversation refresh is 10 seconds. This reduces request amplification but means a newly received message may take up to one polling interval to appear.
- Fixed the client live-chat logout redirect to `../index.html`, the public homepage relative to `pages/chat.html`. Client portal expiry/logout also returns to the public homepage rather than a missing page.
- Added the assigned administrator's profile-photo URL to the verified client's own job record only, and removed the internal admin username before the response is returned. The client dashboard support tile displays that assigned admin's photo when available. Existing tutor profile-photo fields remain in the client tutoring dashboard/cards.
- Bumped the backend build marker to V87 and changed the service-worker cache namespace and static asset query strings so the new frontend behavior can be fetched rather than relying on stale cached scripts.
- Added repeatable test tools: local static-bundle load test, source-level privacy checks, a read-only two-client staging isolation test, and a staging-only authenticated API ramp test.

## Load test actually run

This was a controlled local test of the website's static bundle, not a production backend test. It served local HTML/CSS/JS assets from a local Node HTTP server and simulated 100, 500, 1,000, and 2,000 concurrent virtual users, with 8 requests per user in each stage.

| Virtual users | Requests | Elapsed | Throughput | p50 latency | p95 latency | p99 latency | HTTP failures |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 100 | 800 | 0.53 s | 1,508 req/s | 7.2 ms | 303.5 ms | 408.6 ms | 0 |
| 500 | 4,000 | 1.91 s | 2,099 req/s | 6.1 ms | 1,257.9 ms | 1,697.8 ms | 0 |
| 1,000 | 8,000 | 3.73 s | 2,142 req/s | 5.5 ms | 2,517.8 ms | 3,380.3 ms | 0 |
| 2,000 | 16,000 | 8.10 s | 1,975 req/s | 4.5 ms | 3,958.5 ms | 5,645.1 ms | 0 |

**Interpretation:** the final 2,000-user run returned HTTP 200 for all 16,000 requests; repeated runs varied in total elapsed time and tail latency. Tail latency grew substantially under the local harness. This is not a measurement of GitHub Pages/CDN performance and does not establish 2,000-user production capacity. The harness and the target hosting stack are different.

## Privacy source checks

The included source-level regression check passed **8/8** checks. It verifies that the client summary, client dashboard, and client tutor-session routes authenticate the client before reading cached records; live chat validates the requested conversation before reading message cache; session booking checks conversation ownership; assigned-admin avatar projection exposes only the assigned admin's photo; expired admin/tutor session cleanup exists; and rate limiting is wired into the API request path.

This is source inspection, not proof that every deployed endpoint is secure. The read-only cross-account test tool is included but has **not** been run against live accounts because dedicated staging client tokens/work IDs were not supplied. Do not use real customer credentials in test files.

## Bottlenecks found / remaining

1. **Apps Script + Google Sheets remains the largest scalability risk.** The code has many sheet reads; the earlier audit counted roughly 93 `getDataRange().getValues()` occurrences. The tutor dashboard reads several large sheets on cache misses, and the client portal data path scans the MESSAGES conversation-ID column to identify rows belonging to the client. These costs grow with stored data.
2. **Global script locks serialize some writes.** Booking, request and financial workflows that use `LockService.getScriptLock()` can queue behind one another at high concurrency.
3. **Polling still creates a request floor.** The interval changes and jitter reduce bursts, but 2,000 active chat users can still create substantial request volume. Polling is not a push/realtime architecture.
4. **Script Properties are not a high-volume session database.** Expired token records are cleaned periodically, but active session storage and Apps Script quotas still need redesign for sustained high concurrency.
5. **Rate limiting currently fails open if CacheService errors.** This preserves availability but weakens abuse protection during cache failures; moving throttling to a durable/shared rate-limit service is recommended before launch at scale.
6. **The admin permission fallback remains a least-privilege risk.** In the existing backend, an admin with no explicit permissions can receive legacy allow-all behavior. This was not silently changed because doing so without migrating current admin permission records could lock legitimate administrators out. Fix it with a permission migration and a staged deny-by-default rollout.

## What is required before claiming 2,000 concurrent users

- Deploy the updated `backend/Code.gs` as a new version of the **same** Apps Script web app, keeping the existing `/exec` URL. Deploy the static website bundle as well.
- Provision at least two dedicated staging clients with separate verified tokens/work IDs and run `tools/brightace-privacy-isolation-test.js`. Then test two tutors and two admins, copied conversation IDs, payment IDs, download IDs, and private Drive file permissions.
- Run `tools/brightace-api-load-test.js` against a dedicated staging deployment with 2,000 unique test-only sessions and ramp in stages. Include reads, chat messages, bookings, uploads, and financial writes in a separate approved test; the included API ramp test is read-only.
- Capture Apps Script execution time, quota errors, lock wait times, cache misses, Sheets row counts, API p95/p99, and error rates during the run.
- For a sustained 2,000-user target, plan to move hot transactional records and sessions to a database/API designed for concurrent access, use indexed queries, and use push or adaptive event delivery for chat. Google Sheets should become an administrative/reporting surface rather than the hot-path transactional database.

## Files changed from v5

- `backend/Code.gs` — V87 build marker; assigned-admin photo projection limited to each verified client's own assigned jobs; remove internal assigned admin username from returned request data.
- `js/app.js` — interaction-aware, visibility-aware staggered scheduler with overlap prevention.
- `js/client-portal-pages.js` — skip redundant redraws, defer changed-data refresh during active interaction, preserve scroll, show assigned admin profile photo in dashboard support tile.
- `js/chat.js` — public-home logout redirect fix and less aggressive polling.
- `css/client-portal.css` — stable avatar image sizing and admin support avatar styling.
- `sw.js` — new cache namespace for this release.
- `index.html` and `pages/*.html` — cache-bust updated shared assets; client live-chat logout route updated.
- `tools/brightace-load-test.js` — local static-bundle load test used for this report.
- `tools/brightace-static-privacy-check.js` — source-level privacy regression checks.
- `tools/brightace-privacy-isolation-test.js` — read-only two-client staging isolation test (requires dedicated test sessions).
- `tools/brightace-api-load-test.js` — staged authenticated read-load harness (staging-only safety check).

## Validation performed

- JavaScript syntax checks passed for `js/*.js` and `tools/*.js`.
- Apps Script `.gs` source files passed Node syntax checks after being copied to temporary `.js` filenames.
- Source-level privacy regression checks passed 8/8.
- Local static load test reached 2,000 virtual users / 16,000 requests with zero HTTP failures.
- Production Apps Script backend capacity and live account-to-account privacy were **not** verified in this environment.
