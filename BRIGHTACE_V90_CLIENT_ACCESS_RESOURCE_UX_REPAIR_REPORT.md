# BrightAce Academy V90 — Client Access, Resource UX & Reliability Repair

Date: 2026-10-21

## Summary

This package continues from the supplied V89 ZIP. It repairs the concrete client preflight action-gate defect, improves the public resource viewer, closes a resource-payment status-transition gap, reduces duplicate attachment controls, hardens the 30-minute inactivity boundary on tab resume, and updates deployment/version diagnostics.

## Changes by area

### 1. Client sign-in / `Unknown BrightAce action`
- Added `publicRequestIntakeStatus` to the backend POST security allowlist. The backend already dispatched this action, but the central gate rejected it first, so new/returning-client preflight could fail with `Unknown BrightAce action` before reaching the intended workflow.
- Compared literal frontend API action names against the POST/GET allowlists: no other frontend action names were found missing from either gate.
- Bumped Live Chat, composer, and service-worker cache versions so older cached frontend code is less likely to mask the repair.

### 2. Public Resources media
- Replaced the separate-tab `resource-media.html` launch for image/video cards with an in-page overlay viewer.
- The overlay closes via its X button, Escape, or clicking the backdrop. It locks background scrolling while open and restores it on close.
- Images preserve aspect ratio and use a second Google Drive thumbnail URL as a fallback. If an image still fails, the page explains that public Drive sharing must be checked rather than silently implying that the site can access a private file.
- Videos use the appropriate YouTube, Vimeo, Google Drive preview, or direct-video player when the provider permits playback.
- Document/PDF cards now show a compact document icon and a download action rather than embedding/opening a PDF page in the resource card.
- A supplied click-through URL continues to take precedence and opens its destination (for example, a Google Form).
- Updated `V88_PUBLIC_RESOURCES_AND_ADMISSIONS_GUIDE.md` to describe the current behavior.

### 3. Payment status transition and optional fields
- Added `Paid` as a valid transition from `Awaiting payment`; the backend still refuses to mark a quote paid unless provider verification has set `quotePaymentStatus` to `PAID`.
- The Admin Resources status selector disables `Paid` until verified payment is recorded. It also disables `In preparation` for a quoted request whose payment has not been confirmed.
- Existing validation remains in force: a quote is required before moving to `Awaiting payment`; a delivery file is required before marking a request `Delivered`; extra request details and a delivery file remain optional until the corresponding workflow step needs them.

### 4. Attachments, chat, session expiry, sound, and profile display
- The universal emoji/attachment composer now yields to a form that already has a dedicated file picker, avoiding a second attachment interface in the same form. Existing dedicated chat composers remain in control where they already provide emoji, attachment and photo actions.
- Client Messages now remembers the selected job and channel when a message is sent or the dashboard data is refreshed; switching jobs no longer silently flips an assigned-tutor conversation back to the Admin channel. The Admin channel remains the fallback only when no tutor is assigned to that job.
- Client portal and Live Chat now re-check the 30-minute inactivity boundary when a background tab becomes visible again or returns from browser back/forward cache, so throttled timers do not leave an expired session visible indefinitely.
- Tutor admin ratings remain administrator-controlled. Client-facing tutor profile ratings now use the requested color scale: one star orange, two light green, three/four green-gold, and five shiny gold.
- Existing notification-sound controls and audio unlock behavior were retained; no production sound playback test can be confirmed from static source inspection alone.

### 5. Deployment metadata and operations diagnostics
- Updated backend build identity to `2026-10-21-V90-CLIENT-ACCESS-RESOURCE-UX-REPAIR` and API identity to `brightace-json-v90`.
- Updated deployment metadata and corrected stale hard-coded build checks in production QA/hardening diagnostics so they validate the current build marker format instead of expecting the old V63 build.
- Reviewed the V88 resource guide and V89 admissions report. The V88 guide was updated where the described viewer behavior changed. The V89 deployment checklist remains useful for live verification of blocked/paused admissions cases.

## Files changed

- `backend/BA_Security.gs`
- `backend/BA_Resources.gs`
- `backend/Code.gs`
- `backend/BA_Deployment.gs`
- `backend/BA_ProductionQA.gs`
- `backend/BA_ProductionHardening.gs`
- `js/brightace-composer.js`
- `js/chat.js`
- `js/client-portal-pages.js` (message job/channel selection persistence and star rating colors)
- `pages/resources.html`
- `pages/chat.html`
- `pages/admin-resources.html`
- `sw.js`
- `tools/brightace-v88-resource-test.js`
- `tools/brightace-v89-admissions-gate-test.js`
- `tools/brightace-v86-resource-test.js` (test contract updated to current behavior)
- `tools/brightace-v52-audit.js` (historical performance audit updated to current successor build)
- `V88_PUBLIC_RESOURCES_AND_ADMISSIONS_GUIDE.md`
- `BRIGHTACE_V90_CLIENT_ACCESS_RESOURCE_UX_REPAIR_REPORT.md`

## Validation performed

- V90 client-access/resource contract suite: **46 passed, 0 failed**.
- General regression test: **5 passed, 0 failed**.
- JavaScript and service-worker `node --check`: passed.
- Apps Script `.gs` syntax checks (parsed as JavaScript): passed.
- Inline JavaScript syntax checks: **72 passed** (JSON-LD metadata excluded).
- Frontend action-name versus security allowlist audit: **123 action candidates; 0 missing from both allowlists**.
- ZIP integrity check is performed on the final deliverable.

## Important limits / launch steps

This is a source-package repair, not a production deployment. I cannot verify the live Apps Script/WhatsApp sign-in, actual Drive permissions, external video embed policies, real payment-provider callbacks, or browser audio output from this offline environment. A Drive image must still be intentionally shared as **Anyone with the link — Viewer** to display publicly; frontend code cannot make a private file public.

Before launch:
1. Publish the updated static files to the existing website host.
2. Deploy the entire `backend/` folder as a new version of the same Apps Script Web App, preserving the existing `/exec` URL and script properties.
3. Verify `?action=health` reports build `2026-10-21-V90-CLIENT-ACCESS-RESOURCE-UX-REPAIR` and API `brightace-json-v90`.
4. Run the V89 admissions checklist with dedicated staging/test phone numbers, test a returning client while new admissions are paused, and verify a newly published public image/video/PDF and a Google Form click-through in a private browser.
5. Verify a real test quote payment through the payment provider before moving a request to Paid; never use a real client or real funds for this test.
