# BrightAce V66 — Phone, Verification, Attachments & Performance Fix — 2026-10-02

## Fixed
- Phone selector now displays flag + ISO country initials (for example 🇰🇪 KE), while the dial code remains internal and is not displayed beside the number field.
- Number field accepts the local/national portion only; backend still receives normalized international format.
- Live Chat OTP remains a server-side 6-digit verification flow. Verification codes are hashed at rest, expire after 10 minutes, allow only 3 attempts, and resend requests are throttled. The previous already-verified `verifyChat` bypass was removed.
- Profile photo picker accepts common browser-supported image formats and the camera input uses `capture=user` for front-camera devices. Cropping still occurs before saving.
- Universal textarea composer adds Emoji and Attach Files controls to dynamically generated and static textareas.
- Attachments support up to 10 files, 25 MB per file, with image/document/audio/video extensions. Existing secure backend attachment validation remains in force.
- Client New Request now sends selected attachments and stores them against the new request.
- Client dashboard/tutor message composer sends selected attachments.
- Existing Chat attachments and emoji controls remain intact.
- Existing Google Sheets remain the source of truth; caches are retained for speed.
- Versioned frontend script URLs were updated to avoid stale browser caches.

## Main changed files
- backend/Code.gs
- js/brightace-phone.js
- js/client-portal-pages.js
- js/brightace-composer.js (new)
- HTML pages: global composer/phone script references and cache-busting query strings.

## Deployment
Update `backend/Code.gs` in the SAME Apps Script project and deploy a new version of the existing Web App. Keep the existing `/exec` URL.
