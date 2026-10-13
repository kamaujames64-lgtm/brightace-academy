# BrightAce Academy V52 — Frontend + Mobile Performance

Build: `2026-09-19-V52-FRONTEND-MOBILE-PERFORMANCE`  
API marker: `brightace-json-v52`  
Base: V51 `2026-09-19-V51-FINANCIAL-INTEGRITY-RECONCILIATION`

## Purpose
V52 improves frontend/mobile responsiveness and reduces unnecessary background API polling without changing the existing BrightAce visual design or page structure.

## Main change: visibility-aware polling
A shared `BrightAceScheduler` was added to `js/app.js`.

It:
- uses recursive `setTimeout` scheduling instead of permanent `setInterval` timers
- pauses refresh work while a browser tab is hidden
- immediately refreshes when the tab becomes visible again
- prevents overlapping refresh calls with an in-flight guard
- preserves existing focus protections so refreshes do not interrupt active form entry

The scheduler is now used by the major live workspaces, including:
- Live Chat
- Client Dashboard
- Tutor Dashboard
- Tutor Work
- Tutor Messages
- Admin Dashboard
- Admin conversation view
- Admin Assignments
- Admin Quality Control
- Admin Tutors and tutor chat
- Admin Tutor Earnings

Live Chat polling was moved from 15 seconds to 20 seconds. Other high-frequency workspace polling was normalized toward 20–30 second windows while retaining immediate refresh on page visibility changes.

## Why this matters
With many users leaving dashboards open in browser tabs, fixed polling intervals can continue waking JavaScript and issuing unnecessary requests. V52 stops those background refresh loops and resumes them when the user returns.

This is a frontend efficiency improvement; it does **not** claim a measured production reduction until the deployed `/exec` and representative client population are actually load-tested.

## Preserved
- V51 financial integrity and reconciliation
- V50 security and abuse/session hardening
- V49 client session recovery
- V48 durable message delivery and tutor wallet session handoff
- V47 complete client request history
- Admin history fast path
- comprehensive financial statement
- existing page design, navigation, permissions, and business workflows

## Validation
Run:

`node tools/brightace-v52-audit.js`

The audit is static and verifies the scheduler, page migration, version markers, and retention of V48–V51 functionality.

The production 500-user load test is not claimed unless the deployed `/exec` is reachable and the test is actually executed.

## Deployment
1. Deploy the complete `backend/` folder as a new version of the same Apps Script Web App.
2. Keep the existing `/exec` URL.
3. Keep the existing execution/access configuration.
4. Verify `?action=health` returns JSON with:
   - `build: 2026-09-19-V52-FRONTEND-MOBILE-PERFORMANCE`
   - `api: brightace-json-v52`


## Follow-up upload compatibility and layout patch

- Expanded allowed resource upload MIME types to common image, video, audio, archive, ebook, and office/open-document formats while retaining explicit blocking of active content such as HTML, scripts, and SVG.
- Added filename-extension mappings for common additional formats and signature checks for AVIF, BMP, TIFF, and ICO. This is broad format compatibility, not a guarantee that every proprietary codec or malformed file is accepted.
- Broadened the public media file picker and private-delivery picker to expose the wider supported format set.
- Added fixed minimum column widths, full-width form controls, wrapped filenames, and responsive request-table styling to improve alignment.
- Important: “Unknown BrightAce action” can also indicate the live Apps Script deployment is older than this source. The source router includes `adminUploadResourceFile`; deploy a new Apps Script version and confirm the website API URL targets that deployment.
