# BrightAce Academy V88 — Changes and Validation Report

Date: 2026-10-21

## Requested behavior delivered in the source package

### 1. New-client capacity popup blocks verification

`js/chat.js` now checks `publicRequestIntakeStatus` before starting a new request and fails closed if that status cannot be confirmed. If admissions are paused, the capacity modal appears and the verification panel is not shown. The backend `startChat_` remains authoritative and checks admissions again, covering the race where an administrator pauses intake after the status check. The verification screen is displayed only after the server confirms request creation and verification-code delivery.

The existing capacity text and Returning Client button are preserved. Returning Client opens the existing separate returning-client verification form; it does not create a new client request. Existing verified sessions are not changed by this admission gate.

### 2. Public resource links and full-size media

- Added optional `clickThroughUrl` to the `RESOURCE_PROMOTIONS` schema at the end of the header list so existing columns remain in place. `ensureColumns_` adds the new column on the next backend operation.
- Added server-side HTTPS validation for the optional click-through URL.
- Admin can paste a public media URL or Google Drive file ID, or upload a local file.
- A supplied click-through URL is exposed to the public resource card. If blank, images/videos open a dedicated viewer; documents open their own Drive/source viewer.
- Images use `object-fit: contain`, preserving their aspect ratio in cards and in the dedicated viewer.
- Dedicated `pages/resource-media.html` supports images, YouTube, Vimeo, Google Drive video previews, and direct HTTPS video files.
- Added optional crop controls to the admin form. Cropping is off by default. If enabled, the admin sees a preview, can select Original/Square/4:3/16:9, and can shift the crop horizontally/vertically. The output is rasterized to at most 2400 pixels on its longest edge.
- Added `V88_PUBLIC_RESOURCES_AND_ADMISSIONS_GUIDE.md` with operating steps, privacy warnings, and social publishing guidance.

### 3. Build/cache identity

- Updated the backend build/API identity to `2026-10-21-V88-CAPACITY-PUBLIC-RESOURCES` / `brightace-json-v88`.
- Updated the service-worker cache namespace so the changed public HTML and new viewer page can be fetched under a new cache.
- Bumped the chat JavaScript query version to avoid an old cached chat script.

## Files changed/added

- `backend/Code.gs` — build/API identity.
- `backend/BA_Resources.gs` — click-through field, HTTPS validation, public response, and persistence.
- `js/chat.js` — admission check is fail-closed; no verification view before request and code delivery are confirmed.
- `pages/chat.html` — cache-busting query version for chat.js.
- `pages/admin-resources.html` — media URL entry, click-through field, crop UI/preview/export, and admin list indicator.
- `pages/resources.html` — public media rendering, optional link behavior, full-aspect images, and viewer navigation.
- `pages/resource-media.html` — new responsive full-size image/video viewer.
- `sw.js` — new service-worker cache namespace.
- `tools/brightace-v88-resource-test.js` — current static contract tests.
- `V88_PUBLIC_RESOURCES_AND_ADMISSIONS_GUIDE.md` — administrator guide.
- `BRIGHTACE_V88_CHANGE_REPORT.md` — this report.

## Validation performed

- `node --check` passed for all JavaScript files in the package.
- All Apps Script `.gs` files passed JavaScript syntax checks after being copied to temporary `.js` files for Node's parser.
- Inline JavaScript in `pages/chat.html`, `pages/admin-resources.html`, `pages/resources.html`, and `pages/resource-media.html` passed syntax checks.
- `tools/brightace-static-privacy-check.js`: 8/8 source-level checks passed.
- `tools/brightace-v88-resource-test.js`: 33/33 checks passed, including new capacity-gate, click-through URL, crop tool, and media viewer checks.
- ZIP integrity was checked after packaging.

## Not performed / deployment gates

This is a source-package and static-contract validation pass. It does not access the live Apps Script deployment, real Google Sheets/Drive files, or actual admin/client accounts. I did not run an end-to-end browser test against the production website, upload real sample media, verify a real Google Form, or verify YouTube/Vimeo permissions. Before declaring production behavior fully verified:

1. Deploy the backend source as a new version of the existing Apps Script web app and keep the current `/exec` URL.
2. Test the paused-admissions flow with an unverified new client: the modal should appear and the verification panel should never flash.
3. Test Returning Client verification and an already-verified client while admissions are paused.
4. Create one test image with no click-through link, one image with a Google Form link, one YouTube video, one Drive video, and one PDF. Verify them in an incognito browser on desktop and mobile.
5. If using Google Drive, verify public sharing intentionally. Never make private student/client files public just to make a preview work.

No claim is made that a live deployment has been tested or that external provider links will work when the provider's own sharing/embed settings prevent it.
