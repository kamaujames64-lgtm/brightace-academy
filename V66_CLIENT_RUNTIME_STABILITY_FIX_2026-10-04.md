# BrightAce V66 — Client Runtime Stability & Speed Fix — 2026-10-04

Base package: **BrightAce-V66-NAVIGATION-REPAIRED-CURRENCY-JSON-STABLE-FINAL-20261004**.

## Fixed
- Currency converter is now a compact centered modal. The page behind it remains visible through a light backdrop.
- Currency conversion recalculates immediately on amount/currency changes and refreshes live FX data in the background every 10 minutes while the converter is open.
- Client logout is now available in the shared client workspace top bar and in Profile > Security. It immediately clears local credentials, asks the server to revoke the session, then redirects to the public home page.
- Live chat also has a real client LOG OUT control using the same server session revocation action.
- Client dashboard hot-path session validation now uses the disposable server token cache first, avoiding unnecessary Google Sheets writes on every dashboard read. The canonical sheet-backed validator remains the fallback.
- Client API timeout was changed from 20 seconds to 30 seconds and the timeout message no longer incorrectly claims that the latest deployment is necessarily inactive.
- Client sidebar collapse/expand click handling was hardened so the arrow receives the click reliably and preserves the state in local storage.
- Profile photo cropper was reduced to a compact viewport-safe dialog with a smaller crop stage and compact buttons so all controls remain visible on short/mobile screens.

## Backend deployment
The package still carries the V66 JSON deployment build:
`2026-10-04-V66-SPEED-JSON-STABLE`

The production Apps Script Web App must still be deployed as a **new version of the existing Web App deployment**, keeping the existing `/exec` URL. A ZIP cannot change an already-published Apps Script deployment by itself.
