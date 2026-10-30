# BrightAce Academy V108 repair report

**Date:** 30 October 2026  
**Base:** Uploaded `brightace-academy-workspace-repaired-v107.zip`  
**Scope:** International phone entry, OTP server-side round trips, public Resources API and responsive presentation.

## What I understood and preserved

The priority is to reduce OTP wait time for every country (both message dispatch and post-code verification), retain Kenya's currently working behavior, improve the public Web Resources page on desktop/tablet/mobile, and avoid disturbing existing account, payment, tutor, admin, and client workflows. Changes are targeted and retain the existing Apps Script endpoints, phone input names, stored international digits, and session/security checks.

## Changes made

### International phone picker
- `js/brightace-phone.js`: explicit `+` / `00` international numbers are no longer reinterpreted and rewritten based on the first country sharing a calling code. The full international digits are preserved for submission.
- Shared calling-code inference now prefers the currently selected country when multiple countries use the same dial code (for example `+1`), instead of always choosing the first matching entry.
- Existing local-number entry and selected-country formatting remain in place.

### OTP request and verification processing
- `backend/Code.gs`: `sendVerificationCode_` now reads and writes the conversation row in a single batch instead of making several separate Spreadsheet service calls.
- `returningClientSendVerification_` now batches the OTP hash, expiry, attempt count and pending status into one row write.
- `returningClientVerify_` and the first-time `verifyChat_` path now read the adjacent verification columns together and batch OTP state changes, reducing repeated Spreadsheet service calls. Incorrect-attempt increments are batched too.
- `issueClientSession_` now updates its three adjacent session fields in one range write, without rewriting unrelated client profile cells.
- Existing phone ownership checks, account status checks, code hashing, 10-minute expiry, three-attempt limit, resend limit, WhatsApp send provider and session issuance are retained.

**Important:** WhatsApp delivery time is also controlled by Meta/WhatsApp, the recipient's network and provider routing. These source changes reduce avoidable Apps Script/Sheets overhead; they cannot guarantee a delivery time or prove carrier-side delivery without live tests and provider telemetry.

### Public Web Resources performance and responsive behavior
- `backend/BA_Resources.gs`: public promotional resource listings are cached for 120 seconds and invalidated whenever an administrator saves or deletes a promotion.
- The public listing no longer calls `DriveApp.getFileById(...).getName()` once per promotional item just to populate a display filename. This removes a potentially expensive Drive service call for each item; the page already falls back to the resource title.
- `pages/resources.html`: resource fetch has a 12-second timeout, visible timeout/failure message and a retry control. Existing API action and public data shape remain compatible.
- `pages/resources.html`: refined responsive resource grid/media rules for desktop, tablet and phone, with bounded content and reduced layout work for cards.

### Cache refresh
- Phone-picker script URLs in the 48 HTML entry pages were versioned to V108.
- `sw.js` uses a new V108 cache namespace so browsers do not keep serving the prior V107 static assets.

## Files changed

- `backend/Code.gs`
- `backend/BA_Resources.gs`
- `js/brightace-phone.js`
- `pages/resources.html`
- `sw.js`
- `README.md`
- `BRIGHTACE_V108_REPAIR_REPORT.md` (new)
- 48 HTML files containing the shared phone-picker script reference (query string versioned to V108):
  - `admin-tutor-earnings.html`, `index.html`
  - `pages/about.html`, `pages/admin-assignments.html`, `pages/admin-clients.html`, `pages/admin-history.html`, `pages/admin-login.html`, `pages/admin-observability.html`, `pages/admin-payments.html`, `pages/admin-production-qa.html`, `pages/admin-python.html`, `pages/admin-quality.html`, `pages/admin-recovery.html`, `pages/admin-resources.html`, `pages/admin-scheduling.html`, `pages/admin-team.html`, `pages/admin-tutor-earnings.html`, `pages/admin-tutors.html`, `pages/admin.html`
  - `pages/chat.html`, `pages/client-dashboard.html`, `pages/client-history.html`, `pages/client-messages.html`, `pages/client-new-request.html`, `pages/client-payments.html`, `pages/client-profile.html`, `pages/client-progress.html`, `pages/client-requests.html`, `pages/client-resources.html`, `pages/client-statement.html`, `pages/client-tutoring.html`, `pages/client-work.html`, `pages/contact.html`, `pages/faq.html`, `pages/homework-help.html`, `pages/how-it-works.html`, `pages/payment.html`, `pages/privacy.html`, `pages/receipt.html`, `pages/resource-checkout.html`, `pages/resources.html`, `pages/subjects.html`, `pages/terms.html`, `pages/tutor-messages.html`, `pages/tutor-wallet.html`, `pages/tutor-work.html`, `pages/tutor.html`, `pages/verify-statement.html`.
- Six existing source regression tests updated to recognize the V108 service-worker cache namespace:
  - `tools/brightace-v100-responsive-tutoring-phone-test.js`
  - `tools/brightace-v102-security-gate-test.js`
  - `tools/brightace-v105-workspace-regression-test.js`
  - `tools/brightace-v106-session-workflow-test.js`
  - `tools/brightace-v107-client-history-performance-test.js`
  - `tools/brightace-v88-resource-test.js`
- New `tools/brightace-v108-repair-test.js`.

## Validation and limitations

- Static syntax and source-level regression checks are included in the delivery.
- No live WhatsApp OTP was sent, no production Apps Script endpoint was called, no production spreadsheet or account was modified, and no deployment was made from this environment.
- The 120-second cache is fail-open: if Apps Script CacheService cannot store the payload (for example, if a catalog payload exceeds the cache size limit), the page still reads the source sheet and returns the catalog.
- Real-world OTP timing and responsive behavior still require staging tests on representative devices and countries. Kenya should be tested as a regression baseline alongside Uganda, Tanzania, US, Canada, UK and India.

## Deployment caution

Deploy the complete backend source to a new version of the **same** Apps Script Web App, preserving its existing `/exec` URL and Script Properties. Publish the updated static website and allow the V108 service worker to activate. Then test using staging accounts before production rollout. Do not replace or clear live sheets, existing phone values, Script Properties, Meta credentials, or payment configuration as part of this source update.
