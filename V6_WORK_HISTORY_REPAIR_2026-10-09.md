# BrightAce V66 — V6 Work History Repair

## Problem
Admin Dashboard → History could remain on “Loading…” instead of populating. The History backend was using the full sheet last-row/last-column bounds, while the page was starting with a POST request before trying its GET compatibility path.

## Fix
- `backend/Code.gs`: History now finds the last real `conversationId` row first and reads only the columns required by History, in bounded chunks. This prevents unrelated sheet tails from making the History request slow.
- `pages/admin-history.html`: History prefers the authenticated read-only GET endpoint first, then falls back to POST/legacy GET aliases. Request timeout reduced to 12 seconds so a stalled endpoint cannot leave the UI loading indefinitely.
- Existing restore/delete rules and financial-record preservation are unchanged.

## Build
`2026-10-09-V66-CLIENT-TUTOR-BOOKING-PERF-V6-WORK-HISTORY-REPAIR`
