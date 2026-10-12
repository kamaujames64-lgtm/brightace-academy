# BrightAce V66 — V9 Work History Bottom-Up Repair — 2026-10-11

## Root cause addressed
The V8 History endpoint still discovered the last live CONVERSATIONS row by reading the entire `conversationId` column from row 2 through `getLastRow()`. If the production Google Sheet has a large formatted/formula tail, every History request can scan a very large range before returning anything, leaving the Admin History page apparently stuck on Loading.

## V9 repair
- `backend/Code.gs`: History now finds the last real `conversationId` by scanning upward in 500-row blocks from the bottom and stops as soon as it finds the newest actual conversation row. Existing chunked record loading and lifecycle classification remain intact.
- `pages/admin-history.html`: initial History load bypasses the short cache and requests fresh data so a stale empty cache cannot mask live records.
- `sw.js`: cache namespace bumped to `brightace-v66-runtime-20261011-history-v9` so old V8 page code cannot remain in the browser service-worker cache.
- Build: `2026-10-11-V66-CLIENT-TUTOR-BOOKING-PERF-V9-WORK-HISTORY-BOTTOM-UP-REPAIR`

## Deployment
Deploy these files into the SAME existing Apps Script project and the SAME production Web App deployment. Do not create a second production URL.
