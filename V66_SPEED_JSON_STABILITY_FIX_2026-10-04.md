# BrightAce V66 — Speed + JSON Stability Fix (2026-10-04)

## What changed

This package is based directly on **BrightAce-V66-PHONE-COUNTRY-LOCAL-LOCK-FINAL-20261004.zip**.

### Backend speed layer

- Added `backend/BA_Speed.gs`.
- Client request history now locates all matching conversation rows once and reads them in bounded batches instead of doing one Sheets read per request.
- Client dashboard schedule loading now uses the fast phone/conversation indexes instead of scanning the entire SCHEDULES sheet.
- Tutor profile enrichment now reads only tutors actually assigned to the client's requests.
- Dashboard response cache increased from 15s to 30s; writes invalidate the relevant client caches so normal mutations still refresh quickly.
- Added speed-cache invalidation to conversation/schedule update paths.

### Frontend navigation speed

- Added `sw.js` for same-origin stale-while-revalidate page navigation and static asset caching.
- `js/app.js` now registers the service worker and warms likely next workspace pages during browser idle time/hover.
- `js/client-portal-pages.js` now deduplicates simultaneous dashboard/catalog reads and reduces the client API timeout to 20s so broken deployments fail quickly instead of appearing frozen.
- Dashboard session cache window increased to 45s for instant repeat page rendering while the background refresh keeps data current.

### JSON /exec stability

The frontend now gives a precise error when the production `/exec` endpoint returns an Apps Script HTML page instead of JSON:

> BrightAce /exec is returning HTML instead of the current JSON API. Deploy the latest backend as a new version of the SAME Web App and keep the existing /exec URL.

The backend build is now:

`2026-10-04-V66-SPEED-JSON-STABLE`

The deployment metadata endpoint reports the new V66 API/performance engine.

## IMPORTANT — deployment requirement

A ZIP file cannot replace an already-published Apps Script Web App deployment. If `/exec` is still serving HTML/old code, the production Apps Script project must be redeployed.

Use the **same Apps Script Web App project** and create a **new deployment version**. Do not create a new Web App URL.

Recommended deployment settings:

- Execute as: **Me / the deploying account**
- Who has access: **Anyone** (or the existing access setting already used by BrightAce)
- Create a new version of the existing deployment
- Keep the existing `/exec` URL
- Ensure every `.gs` file in `backend/` is present in the Apps Script project, including the new `BA_Speed.gs`

After deployment, test:

`/exec?action=health`

It must return JSON, not an Apps Script HTML page, and the response build must be:

`2026-10-04-V66-SPEED-JSON-STABLE`

Then test:

`/exec?action=version`

The API field should report `brightace-json-v66`.

## Changed code files

### Backend `.gs`

1. `backend/Code.gs`
2. `backend/BA_ClientHistory.gs`
3. `backend/BA_Deployment.gs`
4. `backend/BA_Speed.gs` — **NEW**

### Frontend JS

1. `js/app.js`
2. `js/client-portal-pages.js`

### New browser performance file

1. `sw.js`

### Documentation

1. `V66_SPEED_JSON_STABILITY_FIX_2026-10-04.md`

No phone-country UI behavior was removed or changed by this speed patch.
