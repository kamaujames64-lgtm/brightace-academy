# BrightAce Academy v104 deployment checklist

## Before deployment
- [ ] Keep the original v103 ZIP as a rollback backup.
- [ ] Extract this ZIP and open `brightace-academy-main/`.
- [ ] Confirm `index.html`, `js/brightace-speed-engine.js`, `css/brightace-speed-engine.css`, `js/chat.js`, `js/client-portal-pages.js`, `pages/client-tutoring.html`, and `sw.js` are present.
- [ ] Review `BRIGHTACE_V104_PERFORMANCE_PRIVACY_PHOTO_REPAIR_REPORT.md`.

## GitHub Pages
- [ ] Commit/publish the contents of `brightace-academy-main/` into the same project repository path that serves `/brightace-academy/`.
- [ ] Wait for the Pages deployment to succeed.
- [ ] Confirm the public homepage and informational pages load.
- [ ] Confirm the service worker is v104 and the console has no errors.

## Google Apps Script
- [ ] Open the existing BrightAce Apps Script project.
- [ ] Apply the changes in `backend/BA_Speed.gs` to the matching source file.
- [ ] Deploy a new version of the same Web App deployment; keep the current `/exec` URL.
- [ ] Verify `clientDashboardBootstrap` succeeds for a valid client and fails for invalid/expired/revoked sessions.

## Security acceptance tests
- [ ] Open a private browser window without logging in; visit client dashboard, messages, tutoring, statement and payment URLs directly. No private data may appear.
- [ ] Verify client A, then log out; confirm old private messages disappear.
- [ ] Verify client B in another session; confirm client A's data never appears.
- [ ] Test expired/revoked session and blocked-client behavior.
- [ ] Confirm chat page does not show the returning-client form at the same time as an authenticated conversation.

## Performance and photo acceptance tests
- [ ] Navigate between supported shared client portal pages; URL changes without a full document reload.
- [ ] Test browser Back/Forward and query-string deep links.
- [ ] Confirm forms, payments, chat/OTP, standalone tutoring booking, and statements continue to use their dedicated flows.
- [ ] Confirm tutor photos load for assigned jobs; if not, verify the API response includes a photo URL and the Drive image is viewable by the intended audience.
- [ ] Record LCP, INP, CLS, initial document TTFB, and Apps Script API response times before/after deployment.
