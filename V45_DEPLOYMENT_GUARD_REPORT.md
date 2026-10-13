# BrightAce Academy V45 — Deployment Guard + Statement/Scalability Continuation

## Purpose

V45 carries forward the V44 comprehensive statement and V43 scalability work and specifically addresses the recurring:

> BrightAce server returned HTML instead of JSON

message.

This error is normally a deployment/version mismatch when the production `/exec` Web App is serving an older Apps Script deployment or an Apps Script HTML/error page instead of the BrightAce JSON API. A ZIP cannot publish a new Apps Script deployment into the owner's Google account, so V45 adds deterministic deployment identification and a read-only verification tool.

## Changes

- Build marker updated to `2026-09-19-V45-DEPLOYMENT-GUARD-COMPREHENSIVE-STATEMENT-SCALABILITY`.
- `doGet?action=health` now identifies the V45 JSON API protocol.
- Added public, non-sensitive `doGet?action=version` endpoint.
- Added `backend/BA_Deployment.gs` with deployment metadata helper.
- Added `tools/brightace-deployment-check.js`.
- Improved key frontend HTML-vs-JSON errors to explicitly identify a stale `/exec` deployment.
- Existing `/exec` URL remains unchanged.
- Existing V44 statement and V43 scalability modules remain in place.

## Deployment procedure

In the existing Apps Script project:

1. Replace/update **all** V45 `.gs` files, including `BA_Deployment.gs`.
2. Save the project.
3. Deploy > Manage deployments.
4. Edit the existing Web App deployment.
5. Select **New version**.
6. Execute as: **Me**.
7. Who has access: **Anyone**.
8. Deploy.
9. Keep the SAME `/exec` URL.

Then run:

```bash
API_URL="https://script.google.com/macros/s/YOUR_EXISTING_DEPLOYMENT/exec" node tools/brightace-deployment-check.js
```

Expected result contains:

- `ok: true`
- `httpStatus: 200`
- `contentType` containing JSON
- `build` beginning with `2026-09-19-V45-`
- `api: "brightace-json-v45"`

## Important limitation

The ZIP itself cannot update the user's Google Apps Script deployment. If the old deployment remains published, the browser can continue receiving HTML even though the local V45 files are correct. The deployment must therefore be updated in the user's Apps Script project.

## Safety

The deployment check is read-only. It does not send messages, modify Sheets, create payments, change assignments, or alter accounts.


## Follow-up upload compatibility and layout patch

- Expanded allowed resource upload MIME types to common image, video, audio, archive, ebook, and office/open-document formats while retaining explicit blocking of active content such as HTML, scripts, and SVG.
- Added filename-extension mappings for common additional formats and signature checks for AVIF, BMP, TIFF, and ICO. This is broad format compatibility, not a guarantee that every proprietary codec or malformed file is accepted.
- Broadened the public media file picker and private-delivery picker to expose the wider supported format set.
- Added fixed minimum column widths, full-width form controls, wrapped filenames, and responsive request-table styling to improve alignment.
- Important: “Unknown BrightAce action” can also indicate the live Apps Script deployment is older than this source. The source router includes `adminUploadResourceFile`; deploy a new Apps Script version and confirm the website API URL targets that deployment.
