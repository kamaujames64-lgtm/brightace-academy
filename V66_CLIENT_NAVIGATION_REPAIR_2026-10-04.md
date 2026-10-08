# BrightAce V66 Client Navigation Repair — 2026-10-04

This repair uses the V66 Currency Converter + JSON Stable package as the base and restores a single consistent client navigation shell.

## Fixed
- Replaced the separate `ba-client-sidebar` workspace shell with the same `client-sidebar` navigation system used by the client dashboard.
- Restored the circular collapse/expand arrow on desktop.
- Restored mobile hamburger behavior.
- Kept `New Request` as a permanent navigation item on every client workspace page.
- Kept the navigation active state consistent for every page, including `New Request`.
- Removed the client navigation promotional quote completely.
- Kept the dashboard search bar clean: no Resources, Sessions, or Messages buttons beside the search field.
- Preserved the currency converter, phone country/local-number lock, speed layer, and JSON deployment safeguards.

## Files changed
- `js/client-portal-pages.js`
- `css/client-portal.css`
- `README.md`

No `.gs` backend code was changed by this navigation repair.


## V66.2 2026-10-04 client runtime stabilization
- Currency converter is a compact modal rather than a full-page replacement.
- Conversion updates immediately while typing and refreshes live FX data in the background.
- Client logout now revokes the server session when reachable, immediately clears browser credentials, and redirects to the public home page.
- A logout control is available in the client workspace top bar on every client portal page.
- Client sidebar collapse/expand click handling is protected against event interception.
- Profile-photo cropper uses a compact, viewport-safe dialog so all controls remain visible.
- Client dashboard read validation uses the disposable session cache on the hot path to avoid unnecessary Google Sheets writes.
- Client API timeout is 30 seconds with a user-safe message rather than incorrectly claiming the deployment is inactive.
