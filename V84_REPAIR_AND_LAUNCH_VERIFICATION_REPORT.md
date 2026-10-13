# BrightAce Academy V84 — Repair and Verification Report
Date: 2026-10-12

## Changes applied
- Updated the backend build marker to `2026-10-12-V84-LAUNCH-READINESS-FINANCIAL-SCHEDULE-STABILITY` and synchronized the health/version API marker to `brightace-json-v84`.
- Added deployment schema definitions for the required `REFUNDS`, `TUTOR_WALLET`, and `SCHEDULE` verification tabs. Existing canonical operational tables (`REFUND_REQUESTS`, `TUTOR_WALLETS`, `SCHEDULES`) are preserved and are still used by the current application handlers.
- Restored the missing `adminRecordTutorPayment_` runtime function as a compatibility entry point into the existing locked, reference-deduplicated tutor-balance payment workflow.
- Added explicit Google Sheets serial-date and serial-time conversion for schedule output and reminder processing. This avoids interpreting spreadsheet day/time serials as JavaScript milliseconds and prevents 1899-era dates from leaking into schedule UI/reminders.
- Updated historical static audit scripts to recognize the current V84 successor marker rather than reporting false failures from hard-coded older release markers.

## Local verification
- JavaScript/Apps Script syntax check: PASS (49 files checked).
- BrightAce regression test: PASS (5/5).
- Production QA static audit: PASS (27/27).
- V63 security/readiness audit: PASS (15/15).
- V50 security/abuse audit: PASS (16/16).

## Important launch gates not verifiable from this ZIP alone
- The Google Apps Script project was not connected to a live spreadsheet or deployed `/exec` endpoint in this environment. The required sheets are defined for creation/alignment, but they must be created in the live spreadsheet by running the documented schema alignment function with the correct `SPREADSHEET_ID`.
- A 1,000-client concurrency target cannot be certified by static tests. Run `tools/brightace-load-test.js` against the actual HTTPS `/exec` endpoint from a networked environment, then perform realistic authenticated read/write load tests and inspect Apps Script quotas, execution time, lock contention, and spreadsheet write limits.
- The compatibility tabs named `REFUNDS`, `TUTOR_WALLET`, and `SCHEDULE` are verification tabs; the operational backend still uses the canonical plural tables to avoid silently redirecting existing data. If an external deployment checker requires these singular tabs to contain mirrored records, a deliberate data migration/mirroring strategy is still needed.
- No claim is made that all visual jumping/disappearing issues are eliminated across all devices without browser-based end-to-end testing. Static checks passed; perform the included production QA workflow on desktop and mobile before launch.

## Recommended deployment sequence
1. Back up the live spreadsheet and Apps Script project.
2. Deploy the updated Apps Script files and set the web app deployment to execute with the intended account and access policy.
3. Run `brightAceSetSpreadsheetIdAndAlign("YOUR_SHEET_ID")` once in Apps Script, then inspect the returned report and verify the new tabs.
4. Run `tools/brightace-deployment-check.js` and `tools/brightace-load-test.js` with the real `/exec` URL.
5. Test tutor wallet/payment, refund request/review, schedule create/update/reminders, profile visibility, chat, and client intake with test accounts.
6. Only launch after the live endpoint, financial write paths, quotas, and 1,000-user load target pass in the production-like environment.


## Follow-up upload compatibility and layout patch

- Expanded allowed resource upload MIME types to common image, video, audio, archive, ebook, and office/open-document formats while retaining explicit blocking of active content such as HTML, scripts, and SVG.
- Added filename-extension mappings for common additional formats and signature checks for AVIF, BMP, TIFF, and ICO. This is broad format compatibility, not a guarantee that every proprietary codec or malformed file is accepted.
- Broadened the public media file picker and private-delivery picker to expose the wider supported format set.
- Added fixed minimum column widths, full-width form controls, wrapped filenames, and responsive request-table styling to improve alignment.
- Important: “Unknown BrightAce action” can also indicate the live Apps Script deployment is older than this source. The source router includes `adminUploadResourceFile`; deploy a new Apps Script version and confirm the website API URL targets that deployment.
