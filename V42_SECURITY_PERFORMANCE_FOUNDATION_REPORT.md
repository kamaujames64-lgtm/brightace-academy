# BrightAce Academy V42 — Security + Performance Foundation

Date: 2026-09-19
Base: V41 Performance / Stability / Regression package

## Scope

V42 is an under-the-hood hardening pass. Existing BrightAce client, admin, tutor, payment, earnings, history, scheduling and chat interfaces were preserved.

## Backend modular structure added

The Apps Script project now contains the requested modular foundation:

- `BA_Security.gs` — API action allowlists and security gateway
- `BA_Sessions.gs` — session policy helpers
- `BA_RateLimit.gs` — lightweight abuse throttling using Cache Service
- `BA_Data.gs` — bounded data-access helpers for future database migration
- `BA_Cache.gs` — centralized cache helpers
- `BA_Messages.gs` — incremental message primitives
- `BA_Sync.gs` — synchronization cursors/responses
- `BA_Monitor.gs` — low-cost timing/security telemetry
- `BA_Validation.gs` — centralized request and attachment validation
- `BA_Files.gs` — upload signature/security checks

These `.gs` files remain one Apps Script project and therefore do not require separate deployments.

## Security changes

1. POST action allowlist rejects unknown application actions before business logic.
2. GET action allowlist rejects unknown GET actions.
3. Centralized validation limits important text fields, IDs, phone format, attachment count/size and filenames.
4. Cache-backed rate limiting was added by action/session/account identity. Apps Script web requests do not expose a dependable client IP to this code, so the limiter intentionally does not pretend that an IP is available.
5. Dangerous executable/script/web file extensions and MIME types remain blocked.
6. Uploaded attachment bytes are checked against declared signatures for PDF/JPEG/PNG/GIF/WEBP and common Office ZIP containers.
7. Attachment filenames are sanitized before Drive creation.
8. Client chat sends now carry a client request ID and the server deduplicates repeated sends for the same request ID.
9. Optional `ADMIN_PASSWORD_SHA256` is supported as the preferred administrator password property while legacy `ADMIN_PASSWORD` compatibility remains.
10. Security/API errors are recorded only as short, non-secret telemetry entries; message bodies and bearer tokens are not written to the security telemetry.

## Performance changes

1. Message GET now supports `afterMessageId` and returns only messages after the client's synchronization cursor.
2. A `syncCursor` is returned with message responses.
3. Message cache access is centralized through `BA_Cache.gs`.
4. Conversation message fallback reads are bounded to the most recent 2,000 sheet rows before retaining the latest 100 conversation messages. This reduces the worst-case scan for a single conversation without changing the visible 100-message chat window.
5. Existing V41 visible-only polling remains in place, so hidden tabs do not continue polling.
6. Performance telemetry records lightweight duration buckets and flags slow requests without storing sensitive payloads.

## Security limitation intentionally retained

Existing BrightAce attachment links use Google Drive `ANYONE_WITH_LINK` because current client/tutor pages need browser-accessible files without a Google sign-in. V42 preserves that behavior to avoid breaking document delivery. A future authenticated file-serving layer can remove public-link sharing once a compatible delivery endpoint is introduced.

## Validation performed

- All backend `.gs` files pass Node syntax validation after copying to `.js` for parser compatibility.
- `js/chat.js` passes Node syntax validation.
- All 44 inline HTML script blocks pass syntax validation.
- No duplicate IDs were found within individual HTML pages.
- No duplicate top-level backend function names were found.
- V42 security scanner: 11/11 checks passed.
- V42 regression scanner: 5/5 checks passed.

## 500-client test status

A real 500-client production stress test was **not** claimed or fabricated. The previous V41 environment could not reach the deployed Apps Script endpoint from the execution environment. The existing safe load-test harness remains in `tools/brightace-load-test.js`; it is read-only by default and supports up to 500 concurrent requests when run from an environment that can reach the production `/exec` URL.

## Deployment

1. Deploy the updated `backend/Code.gs` plus all new `backend/BA_*.gs` files as a new version of the same Apps Script Web App.
2. Keep the existing production `/exec` URL.
3. Keep the existing Apps Script spreadsheet/Drive Script Properties.
4. Optionally add `ADMIN_PASSWORD_SHA256` and migrate administrator credentials later; do not remove the legacy password property until the new login has been verified.
5. Replace the hosted frontend files with the V42 package.
6. Hard-refresh browsers with Ctrl+F5.

## Next planned layer

V42 establishes the security/performance foundation. The next logical layer is V43 messaging/data optimization: more targeted sheet reads, status-change synchronization, cache invalidation refinement, and realistic 500-client mixed-workload testing. A database migration should be based on measured bottlenecks rather than introduced blindly.
