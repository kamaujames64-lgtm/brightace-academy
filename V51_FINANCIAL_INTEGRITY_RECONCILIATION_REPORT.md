# BrightAce Academy V51 — Financial Integrity + Reconciliation

Build: `2026-09-19-V51-FINANCIAL-INTEGRITY-RECONCILIATION`
API marker: `brightace-json-v51`
Base: V50 `2026-09-19-V50-SECURITY-ABUSE-SESSION-HARDENING`

## Purpose
V51 hardens the financial layer without changing the existing client-facing design. It adds a read-only reconciliation engine and fixes a mutation-order problem in the Admin tutor-balance payment path.

## Reconciliation coverage
The new `baFinancialIntegrity_()` audit compares:
- confirmed client payments
- approved refunds
- tutor payout earnings and paid portions
- tutor payment history
- paid tutor withdrawals

Checks include:
- duplicate payment/payment-history/withdrawal/payout references
- paid client payments missing processor references
- approved refunds without processor references
- refunds against unpaid or missing payment requests
- refund currency mismatch
- refund exceeding the originating payment
- negative payout values
- payout remaining-amount math
- payout marked PAID without being fully paid
- multiple payouts for one work item
- paid withdrawals missing payment-history records
- payout/history total mismatches
- payment-history/withdrawal total mismatches

The response groups totals by currency and reports `PASS` or `REVIEW_REQUIRED` plus bounded issue details.

## Important integrity fix
`adminMarkTutorBalancePaid_()` previously performed payout-row mutations before its duplicate-reference checks later in the function. If a duplicate reference was supplied, the request could fail after partial ledger mutation.

V51 moves those duplicate-reference checks to the beginning of the locked transaction, before payout rows are changed.

## Safety
The new reconciliation endpoint is deliberately **read-only**. It does not automatically repair, delete, reverse, or rewrite financial records. Any discrepancy is surfaced for controlled Admin review.

## Preserved
- V47 complete client request history
- V48 durable WhatsApp/message delivery queue and tutor wallet session handoff
- V49 client session recovery
- V50 security/abuse hardening and Live Chat session recovery
- Admin history fast path
- comprehensive admin statement
- deployment/version guard
- existing frontend design and page structure

## Validation
Run:

`node tools/brightace-v51-audit.js`

The production deployment checker is updated for V51. A live production load test is not claimed unless the deployed `/exec` is actually reachable from the test environment.

## Deployment
1. Deploy all `backend/` files as a new version of the same Apps Script Web App.
2. Keep the existing `/exec` URL.
3. Keep the existing execution/access configuration.
4. Verify `?action=health` returns JSON with:
   - `build: 2026-09-19-V51-FINANCIAL-INTEGRITY-RECONCILIATION`
   - `api: brightace-json-v51`
5. The new Admin endpoint is available as `action=adminFinancialIntegrity` for authenticated Admin users with the existing PAYMENTS permission (and Super Admins).


## Follow-up upload compatibility and layout patch

- Expanded allowed resource upload MIME types to common image, video, audio, archive, ebook, and office/open-document formats while retaining explicit blocking of active content such as HTML, scripts, and SVG.
- Added filename-extension mappings for common additional formats and signature checks for AVIF, BMP, TIFF, and ICO. This is broad format compatibility, not a guarantee that every proprietary codec or malformed file is accepted.
- Broadened the public media file picker and private-delivery picker to expose the wider supported format set.
- Added fixed minimum column widths, full-width form controls, wrapped filenames, and responsive request-table styling to improve alignment.
- Important: “Unknown BrightAce action” can also indicate the live Apps Script deployment is older than this source. The source router includes `adminUploadResourceFile`; deploy a new Apps Script version and confirm the website API URL targets that deployment.
