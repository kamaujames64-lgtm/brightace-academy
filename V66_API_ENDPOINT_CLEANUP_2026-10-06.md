# BrightAce V66 API Endpoint Cleanup — 2026-10-06

## Purpose
Remove stale V45/V46 deployment instructions and obsolete hard-coded Apps Script Web App URLs from executable frontend code.

## Canonical production endpoint
The frontend must use `js/brightace-api-config.js` and `window.BRIGHTACE_API_URL`.

Current production Web App `/exec`:
https://script.google.com/macros/s/AKfycbzs69au8SaV3o8wu2DHzD4VTY96oHVe0c_RUzEzzaMhD7yBkYnXujm_aJE7ZouY-JsK/exec

## Changed files
- `js/chat.js` — removed V46 redeployment instruction from JSON parse failure.
- `pages/admin.html` — removed V45/V46 redeployment instructions and changed diagnostics to V66.
- `pages/admin-login.html` — removed V46 redeployment instruction and changed diagnostic to V66.
- `pages/client-statement.html` — removed two obsolete hard-coded Apps Script URLs; statement page now uses only `window.BRIGHTACE_API_URL` and fails clearly if configuration is missing.

## Intentionally retained
Historical V45/V46 report files and backend history-engine labels were not removed because they document or implement historical functionality; they are not frontend deployment endpoints.

## Deployment rule
Do not create another Web App. Update the existing production Web App deployment to the new script version so the existing `/exec` URL remains unchanged.
