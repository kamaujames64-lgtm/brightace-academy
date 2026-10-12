# BrightAce V66 — V8 Work History Transport / Cache Repair — 2026-10-10

## Root cause found
The V7 package corrected the spreadsheet reader, but the static site service worker was still using the older `brightace-v66-runtime-20261009-tutorbookingperf-v3` cache. That allowed an older `admin-history.html` to continue being served. The V7 History page also used a multi-alias GET/POST fallback that could spend a long time retrying several endpoints before showing an error.

## V8 repair
- Bumped the service-worker cache namespace to force replacement of the old cached Admin History page.
- Changed Admin History to use the same POST transport as the working Admin Dashboard.
- Limited transport to two attempts with a hard 12-second timeout.
- Removed the five-GET-alias fan-out that could make History appear stuck on Loading.
- `adminListWorkHistory` still reads the configured `SPREADSHEET_ID` -> `CONVERSATIONS` sheet and remains the single source for Pending / Completed / Rejected history.
- Refresh now controls the `fresh` flag correctly; initial load can use the short-lived cache, while Refresh requests a fresh sheet read.

## Changed files
- `sw.js`
- `pages/admin-history.html`
- `backend/Code.gs` (build marker only)
