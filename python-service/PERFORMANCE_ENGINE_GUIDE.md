# BrightAce Performance Engine (staged, not live-connected)

## What this adds

- Optional **shared Redis cache** (`app/performance_engine.py`). It works across Render instances when configured; it does not silently use per-process memory.
- Protected `/api/v1/engine/status` endpoint for operational readiness checks.
- Protected cache primitives under `/api/v1/cache/{namespace}/{key}` with namespace/key validation, TTL limits, and a 256 KB value cap.
- Bounded synchronous job admission per Render instance. When busy, jobs receive HTTP 429 and should retry with exponential backoff instead of consuming unlimited workers.
- A documented architecture and safe staged rollout plan.

## Important boundaries

This is an **engine foundation**, not a guarantee of 3,000 concurrent active backend operations. No load test against the live Render service, Apps Script project, or spreadsheet has been performed. Static GitHub Pages can serve many page views efficiently, but the API, database, and external service quotas determine how many simultaneous authenticated operations the site can sustain.

Existing Apps Script and Google Sheets remain the source of truth. Do not put the service key in browser JavaScript. Do not use this cache for sessions, authorization decisions, payments, or raw private client/tutor data. Cache only reviewed, derived, non-sensitive results; partition any future cache keys by role/tenant and data version as appropriate.

## Recommended production architecture

1. **GitHub Pages/CDN:** static HTML, JS, CSS, images, and public assets. Versioned cache files; do not cache authenticated HTML or API responses in the service worker.
2. **Apps Script:** keep current authentication, payment, client, tutor, and admin workflows. Add only narrowly scoped server-side calls to Python after role/session checks.
3. **Render Python API:** CPU-heavy, bounded, reviewed features; scale horizontally after measuring CPU, memory, p95 latency, error rates, and dependency bottlenecks.
4. **Managed Redis:** shared short-TTL cache for non-sensitive derived data and distributed coordination. Set `REDIS_URL` in Render's secret environment settings; never commit it.
5. **Managed PostgreSQL:** add only for new high-throughput indexes/search/job metadata or explicitly migrated domains. It must not become a second conflicting source of truth. Use migrations, connection pooling, backups, and a clear reconciliation plan before moving authoritative data.
6. **Durable queue/worker:** add a managed queue (or a queue backed by Postgres/Redis) for long-running file, AI, or batch work. Return a job ID quickly and poll status; do not hold an HTTP request open for long jobs.
7. **Search:** for larger datasets, build a separately indexed search/read model and update it from controlled events. Do not scan whole Google Sheets on every keystroke/request. Start with batched reads, indexed lookups where possible, short TTLs for public/non-sensitive results, and backoff on quota errors.

## Deploy in stages

1. Commit this ZIP to a **test branch**; do not replace the live service yet.
2. In Render staging, set `BRIGHTACE_SERVICE_API_KEY`, `ALLOWED_ORIGINS`, `MAX_INFLIGHT_JOBS`, and optionally `REDIS_URL` using secret environment settings. The cache is disabled when `REDIS_URL` is blank.
3. Deploy the Python service and verify `/health`, `/api/v1/capabilities`, unauthenticated `/api/v1/engine/status` (must return 401/503), authenticated engine status, and protected cache read/write with a short TTL.
4. Run `python -m pytest -q` in `python-service/`.
5. Run a controlled load test against staging (not production) at increasing concurrency, for example 25, 100, 250, 500, then 1,000 clients. Measure p50/p95/p99 latency, 429/5xx rates, CPU, memory, Redis latency, and Apps Script/Sheets quota use. Do not jump straight to 3,000.
6. To claim 3,000 simultaneous users, define the workload first (3,000 logged-in browser sessions vs 3,000 requests per second are very different), test a representative mix, and scale Render/Redis/database/queue based on measured results. Free Render services cannot scale horizontally; autoscaling requires an eligible paid workspace. See official Render scaling documentation.
7. Only after staging tests pass, integrate a specific Python feature through an authenticated Apps Script proxy. Do not route every existing action through Python in one change.

## Google Sheets and Apps Script limits

Apps Script has execution and service quotas; Sheets API has per-minute request quotas. Batch reads/writes, avoid repeated full-sheet scans, use short backoff on 429/transient errors, and cache only data that is safe to cache. Official docs:
- https://developers.google.com/apps-script/guides/services/quotas
- https://developers.google.com/workspace/sheets/api/limits
- https://render.com/docs/scaling

## Not yet implemented

- No live Redis or PostgreSQL instance has been provisioned.
- No Google Sheet has been connected directly to Python.
- No new production Apps Script proxy has been enabled.
- No queue, search index, or load-test result is claimed.
- No deployment has been made by this package.
