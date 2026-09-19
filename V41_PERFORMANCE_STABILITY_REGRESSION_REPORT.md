# BrightAce Academy V41 — Performance, Stability, Sync & Regression Hardening

## Scope

This release is based directly on V40 and keeps the existing UI/design and business workflows intact. Changes focus on runtime efficiency, synchronization behavior, session continuity, data completeness, and safe diagnostics.

## Implemented

### 1. Asset loading / responsiveness
- Added WebP versions of the existing BrightAce logo and graduates hero image.
- Updated page references to use the smaller WebP assets while retaining the original source images in the package.
- Added `loading="lazy"` and `decoding="async"` to non-critical content images.
- Kept the primary logo/hero branding eager so the header/hero does not flash.
- Added no new external UI framework or dependency.

Observed static asset reduction for the two highest-impact images:
- `brightace-logo.png`: 692,722 bytes -> `brightace-logo.webp`: 50,884 bytes.
- `brightace-graduates.png`: 3,173,359 bytes -> `brightace-graduates.webp`: 116,968 bytes.
- Combined reduction for those two served assets: about 95.6%.

### 2. Auto-refresh / synchronization
Corrected several inverted background-refresh conditions where pages were polling while hidden instead of while visible.
- Client dashboard: 20s visible-only refresh, paused while editing.
- Tutor dashboard: 15s visible-only refresh, paused while editing.
- Tutor work: 15s visible-only refresh, paused while editing.
- Tutor admin messages: 12s visible-only refresh, paused while composing.
- Admin dashboard: 20s work-list refresh and 12s selected-conversation refresh, visible-only and paused while editing.
- Admin assignments: 20s visible-only refresh.
- Admin tutors: 30s visible-only refresh and 15s selected tutor-message sync.
- Admin quality: 20s visible-only refresh.
- Tutor earnings: existing 30s visible-only refresh retained.
- Admin History remains user-triggered rather than adding another continuous poll.

### 3. Live chat reliability
- Added an in-flight guard to client live-chat synchronization so overlapping polls cannot race each other.
- Client message rendering is explicitly timestamp ordered before display.
- Existing cache-backed message delivery is retained.

### 4. History/API efficiency
- Admin History no longer calls `getMaxRows()` + `findAll()` over the whole sheet to locate the last conversation.
- It now searches only the used rows and retrieves the last matching conversation ID with `findPrevious()`.
- History records are still processed in bounded 250-row chunks.
- One malformed row cannot stop the remaining history records.
- Existing GET aliases remain supported to prevent older clients from producing `Unknown GET action`.

### 5. Client historical requests
- A verified client session now loads the client's complete request history by authenticated WhatsApp number, including legacy/older records whose `verificationStatus` field was not populated consistently.
- Older/closed requests are not silently omitted.
- `currentRequest` now uses the already-normalized request object instead of reparsing the entire conversation array.

### 6. Tutor acceptance / wallet continuity
- Tutor Assigned Work now displays `✓ JOB ACCEPTED` and disables Accept/Decline once the tutor has accepted or progressed the work.
- Tutor Wallet received an additional session-handoff recovery attempt and a bounded API retry/timeout path.
- The existing canonical tutor session remains the single session source.

### 7. Codebase consistency
Static inspection found:
- No duplicate top-level function definitions in `backend/Code.gs`.
- No duplicate HTML element IDs in the page set.
- No missing local asset references after the asset changes.
- Existing V40 admin/tutor canonical session objects remain in place.

## Validation performed

- `js/app.js`: Node syntax check passed.
- `js/chat.js`: Node syntax check passed.
- `js/statement-pdf.js`: Node syntax check passed.
- `backend/Code.gs`: syntax checked as JavaScript after copying to a `.js` extension; passed.
- All inline `<script>` blocks in the HTML pages: 44 checked, 0 syntax failures.
- Local asset/reference audit: 0 missing references.
- Duplicate HTML ID audit: 0 duplicate IDs.
- Backend function-name audit: 0 duplicate function definitions.

## 500-client load testing

A production 500-client stress test was **not executed from this environment** because outbound DNS/network access to the production Apps Script endpoint is unavailable here. No fake latency or server results are being reported as if they were real.

A safe read-only load-test harness has been added:

`tools/brightace-load-test.js`

It defaults to the non-mutating `health` endpoint and supports authenticated read-only API actions. It reports:
- total requests
- concurrency
- success/failure count
- requests/second
- p50/p95/p99/max latency
- failure reasons

It refuses mutation actions.

## Remaining live verification

To complete real-world performance verification, run the included load test against the deployed `/exec` endpoint and separately test authenticated read-only workloads with real admin/tutor/client session tokens. Browser DevTools should also be used on the deployed site for actual network waterfall, memory, CPU, and device responsiveness measurements.

## Deployment note

The backend changes require deploying the V41 `backend/Code.gs` as a new version of the existing Apps Script Web App while preserving the same production `/exec` URL.

Frontend changes require replacing the hosted site files with this V41 package.
