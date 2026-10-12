# BrightAce V66 — V7 Work History / Google Sheet Connection Repair — 2026-10-10

## Root cause addressed
V6 still depended on the generic `getConversationSheet_()` path and treated the `fresh` GET parameter too strictly (`fresh===true`). More importantly, the History reader could not distinguish a configured production spreadsheet problem from a slow/empty history read. The generic sheet helper can also create a missing sheet, which is unsafe for a read-only History diagnostic because it can hide a wrong `SPREADSHEET_ID`.

## V7 repair
- History now opens the exact spreadsheet from Script Property `SPREADSHEET_ID` and requires the existing `CONVERSATIONS` sheet; it never creates a replacement sheet for History.
- History `fresh=1` and `fresh=true` are now honored.
- History scans in 2,500-row chunks instead of 400-row chunks to reduce Apps Script round trips.
- Added authenticated `adminHistoryDiagnostics` GET/POST endpoint reporting spreadsheet name, CONVERSATIONS existence, dimensions, conversationId column, non-empty ID count, and sample IDs (only the final six characters of the spreadsheet ID are exposed).
- Admin History always requests a fresh server read on page load/refresh, avoiding stale cache as the source of truth while this issue is repaired.
- Frontend timeout increased to 15 seconds and existing visible error/retry behavior remains.

## No financial data changes
This patch only changes History reading/diagnostics. Payment records are untouched.
