# BrightAce API /exec deployment repair

This package keeps the existing BrightAce visual design and page structure unchanged.

## What was repaired

- `backend/Code.gs` now wraps the complete `doGet` API dispatcher in a JSON error boundary.
- Added an explicit `doOptions()` JSON response for diagnostics/future preflight callers.
- Added `js/brightace-api-config.js` as the single frontend API endpoint configuration.
- All executable frontend endpoint references were normalized to that shared endpoint variable.
- Added `backend/appsscript.json` with the intended web-app execution/access settings for Apps Script project/deployment workflows.
- Existing WhatsApp webhook verification remains plain text because Meta requires the challenge response; normal BrightAce API responses remain JSON.

## Critical live step

A source ZIP cannot change an already-published Google Apps Script deployment by itself.

In the Apps Script project that owns the BrightAce `/exec` URL:

1. Replace/save `Code.gs` with `backend/Code.gs`.
2. Ensure `appsscript.json` is applied if you manage the project through clasp/import.
3. Deploy -> Manage deployments -> edit the BrightAce Web app.
4. Create/select a **new version** using the saved code.
5. **Execute as:** Me / User deploying.
6. **Who has access:** Anyone (anonymous/public web-app access).
7. Deploy.
8. Open the exact `/exec?action=health` URL in a browser.

The health URL must return JSON beginning with something like:

`{"ok":true,"service":"BrightAce Academy Live Chat","build":"2026-09-18-REQUEST-INTAKE-CONTROL-1",...}`

If that exact URL still displays a Google HTML page, login page, permission page, or "Script function not found" page, the live deployment is still not the BrightAce deployment/version. The frontend cannot correct an unpublished Apps Script deployment.

## Design preservation

No CSS, images, colors, typography, page layout, navigation design, or visual components were intentionally changed by this repair.
