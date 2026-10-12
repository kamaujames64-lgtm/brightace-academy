# BrightAce V10 — Client Navigation + Camera + Profile Image + Refund + History Repair

Base: BrightAce V66 — V9 Work History Bottom-Up Repair

## Repairs

1. Admin History
- History now uses the exact same `getConversationSheet_()` sheet resolver as the working Admin Dashboard instead of maintaining a second spreadsheet-opening path.
- History retains bottom-up bounded discovery of the last real conversation row.
- Initial History load uses the normal cache path; Refresh explicitly requests fresh data.
- Added a Sheet Diagnostic button to show the configured spreadsheet, CONVERSATIONS row count, conversation ID count, and build.

2. Client 30-minute inactivity session
- Preserved rolling 30-minute inactivity behavior.
- Activity listeners already cover clicks, keyboard, input, pointer/touch and periodic scrolling.
- Service-worker page loading is now network-first so stale cached client pages cannot silently keep old navigation/session code.

3. Profile photo camera
- TAKE PHOTO no longer opens the device file picker first.
- It directly requests the device camera with `getUserMedia()` when supported.
- Captured photo is sent through the existing crop/zoom frame before saving.
- Unsupported browser camera environments have a fallback to the camera-capable file input.

4. Profile image support
- Device picker now accepts `image/*` rather than a narrow extension list.
- Cropped images are normalized to JPEG before upload, avoiding server-side signature failures caused by source image format.
- Client profile upload no longer rejects a decoded image based on the old JPEG/PNG/WebP/GIF signature validator; MIME, base64 and size validation remain.
- Saved profile image is immediately shown in the profile preview, profile avatar, and top client avatar.

5. Payments & Invoices
- Removed every per-payment `INITIATE REFUND` button.
- Retained the single `REQUEST REFUND` button at the top of Payments & Invoices.
- Existing refund request modal and backend `submitRefundRequest` flow remain unchanged.

## Changed files
- backend/Code.gs
- js/client-portal-pages.js
- js/brightace-profile-cropper.js
- sw.js
- pages/client-dashboard.html
- pages/client-messages.html
- pages/client-new-request.html
- pages/client-payments.html
- pages/client-profile.html
- pages/client-progress.html
- pages/client-requests.html
- pages/client-resources.html
- pages/client-tutoring.html
- pages/client-work.html
- pages/admin-history.html

## Deployment
Deploy this package into the SAME Apps Script project and SAME production Web App deployment. Do not create a second production URL.

Expected build:
`2026-10-11-V66-CLIENT-TUTOR-BOOKING-PERF-V10-CLIENT-NAV-CAMERA-REFUND-HISTORY-REPAIR`
