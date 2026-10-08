# BrightAce V66 — Authentication Session Hardening — 2026-10-06

Health showed the V66 API was healthy but recorded a recent AUTH_ERROR. The existing 30-minute inactivity policy remains unchanged.

Change made:
- `js/client-portal-pages.js` now centrally treats authenticated client session/verification/access-token errors as a session-expiry event and immediately clears the browser session and redirects to the public BrightAce home page.
- Normal non-authentication errors are still surfaced normally.
- The backend `.gs` authentication rules were not weakened or extended; a 30-minute inactive client session still expires.

No spreadsheet/schema change. No API URL change.
