# BrightAce Academy V86 — Resource Management, Direct Uploads, Pricing & Payment Repair

**Build:** `2026-10-12-V86-RESOURCE-MANAGEMENT-DIRECT-UPLOADS-PRICING-PAYMENT-REPAIR`  
**Source:** `BrightAce-Academy-V85-Integrated-Session-Feedback-Finance-Messaging-Repair.zip`  
**Status:** Local source repair and static/unit checks completed. **Not production-verified.**

## Architecture inspected

- Static HTML/CSS/JavaScript website with public resources, client dashboard resource requests, admin resources workspace and checkout callback page.
- Google Apps Script Web App backend in `backend/Code.gs` plus modular `.gs` files.
- Canonical Google Sheets schemas for `RESOURCES`, `RESOURCE_PURCHASES`, `RESOURCE_ACCESS`, `RESOURCE_PROMOTIONS`, and `RESOURCE_REQUESTS`.
- Google Drive resource storage and existing Paystack provider adapter.
- Existing action allowlist, admin/Super Admin gates, file signature/threat helpers, security/regression/load scripts, and prior resource feature reports.
- Existing chat and messaging composer is shared across the website; its attachment behavior is preserved outside resource text-only forms.

## Defects and gaps addressed

1. Admin resource creation/editing required copying Drive IDs; edit also cleared the hidden ID and forced re-entry.
2. Promotional media and client delivery also required Drive IDs/URLs instead of direct local file selection.
3. The existing resource-request record did not include quotation or quote-payment state, so request-to-quotation-to-payment was not a complete workflow.
4. Resource request UI did not expose a quotation amount/payment action or status filtering.
5. Resource catalog checkout could create a fresh pending transaction on repeated submissions; verification/access creation was not serialized against repeated callbacks.
6. Universal composer enhancement added emoji and attachment controls to every textarea, including resource descriptions, objectives and admin responses.
7. Public resource media had fixed CSS containers, but image/video intrinsic dimensions were not consistently declared in markup.
8. Existing threat defense's request envelope limit was below the encoded size needed for supported direct uploads.

## Changes made

| File | Change |
|---|---|
| `backend/BA_Resources.gs` | Authenticated direct-upload endpoint; private/public Drive folder separation; allowlisted MIME/extension/content checks; file retrieval/size/sharing verification; quote columns and transitions; client-owned quote payment initiation; provider-side quote verification; idempotent/repeated payment handling; quote payments included in admin sales summary; stricter request fulfillment and price validation. |
| `backend/Code.gs` | Dispatches `adminUploadResourceFile` and `clientApproveResourceQuote`; V86 build and health API markers. |
| `backend/BA_Security.gs` | Adds the two actions to the existing POST allowlist. |
| `backend/BA_SpreadsheetSchema.gs` | Extends the existing `RESOURCE_REQUESTS` schema with quote/payment columns; no parallel quote sheet added. |
| `backend/BA_Files.gs` | Recognizes the legacy Office compound-file signature as well as OpenXML ZIP signatures. |
| `backend/BA_ThreatDefense.gs` | Raises the bounded raw request envelope to 35 MiB for base64-wrapped uploads up to the existing 25 MiB attachment ceiling; only archive-like formats are passed to ZIP inspection. |
| `pages/admin-resources.html` | Direct file pickers for paid resources, thumbnails, promotional media and private request deliveries; quote input, status filter/search, upload activity feedback and button guards; no manual Drive ID entry required in these workflows. |
| `pages/resources.html` | Explicit media dimensions, lazy image loading and reserved media space to reduce layout shift. Existing one-time fetch and static-like display retained. |
| `pages/resource-checkout.html` | Recognizes request-quotation payment confirmations and links the client back to their dashboard. |
| `js/client-portal-pages.js` | Shows request quotations and payment status; client can explicitly approve the quote and proceed to the configured provider checkout. |
| `js/brightace-composer.js` | Skips text-only resource forms/fields while retaining the shared emoji/attachment composer for genuine messaging workflows. |
| `tools/brightace-v86-resource-test.js` | Adds V86 resource, upload, pricing and payment contract checks plus executable helper unit tests. |
| `README.txt` | Adds V86 deployment and limitation notes. |

## Resource request workflow after repair

1. A verified client submits a request; existing duplicate-submit protection and canonical `RESOURCE_REQUESTS` storage are retained.
2. An authorized Super Admin reviews the request, enters a USD quotation, and sets status to `Awaiting payment`.
3. The client sees the quotation and payment state in the authenticated resource dashboard.
4. The client clicks **Approve quotation & pay**. The backend re-checks request ownership, quote amount and state, then initializes the existing Paystack provider using the server-stored amount. Repeated clicks reuse the existing authorization URL/reference.
5. The checkout callback and existing Paystack webhook both verify the provider transaction, amount and USD currency. Only the verified backend updates the quote payment state to `PAID` and request status to `Paid`.
6. Admin advances a paid quote to `In preparation`, uploads the requested file, and marks it `Delivered`. The client delivery endpoint verifies account ownership and `Delivered` status before streaming the file.

The backend rejects an admin attempt to mark an unpaid quotation as paid and blocks a quoted request from entering fulfillment until payment is verified. Existing legacy no-quote request paths/statuses are retained where possible. Quote-payment refunds are not automated by this change; the existing catalog purchase refund path remains separate.

## Pricing and payment behavior

- Catalog resource prices remain USD, server validated as positive and capped at USD 100,000.
- Quote amounts must be positive, no more than USD 100,000, and have at most two decimal places.
- Catalog payment initialization uses the server-side resource price, reuses a recent pending checkout for the same resource/email or phone, and runs under a script lock to reduce duplicate initiation.
- Purchase verification compares provider minor-unit amount and currency to the stored purchase, then locks/rechecks before writing `PAID` and ensuring access. Repeated confirmations short-circuit once paid.
- Request quotations use the existing Paystack provider adapter and store their quote amount, currency, reference, authorization URL, payment state and paid timestamp in the existing `RESOURCE_REQUESTS` row.
- Admin sales totals include verified paid request quotations, visibly tagged as quote payments. The catalog-specific resource analytics still report catalog sales by catalog resource; request quotations are not attributed to a catalog resource.
- The system must retain a valid `PAYSTACK_SECRET_KEY` in Apps Script Script Properties and a correct `PAYMENT_CALLBACK_URL`. Paystack must support USD for the merchant account.

## Direct upload and Drive permissions

- Super Admin-only backend upload action; the browser never receives Google credentials.
- Accepted types: PDF, supported Office formats, RTF/text/CSV, JPEG/PNG/WebP/GIF and supported MP4/WebM/Ogg/QuickTime video containers.
- The server checks filename, extension, MIME allowlist, file signature where supported, archive safety where applicable, file size, Drive readability and stored byte count.
- Paid-resource and private-delivery uploads are kept private at upload time. A paid catalog file is granted `Anyone with the link — Viewer` only when the admin publishes it as a `PUBLIC` paid catalog entry, because the existing checkout hands the buyer a Drive link.
- Promotional media and thumbnails are explicitly link-viewable after upload.
- Private client delivery uses a dedicated private Drive folder and does not enable public sharing; access is streamed only after backend ownership/status checks.
- Upload limits: **20 MiB** for catalog/media uploads and **4 MiB** for private client delivery (the latter matches the current Apps Script JSON/base64 delivery implementation). The generic existing attachment limit remains 25 MiB.
- Upload retries using the same selected File object reuse an upload idempotency key while the server cache entry remains available.

**Drive access limitation:** a Google Drive “anyone with the link” URL is shareable and is not DRM. Once a buyer receives a paid-resource link, it may be shared outside BrightAce. This preserves the existing checkout architecture rather than falsely promising permanent paywall enforcement. Do not upload confidential/private client material as public promotional media or as a public paid catalog resource.

## Static-like rendering and forms

- Public Resources remains server-backed persistent content, not hardcoded frontend content.
- Resource media uses reserved dimensions and lazy image loading; the page does not poll or periodically replace the resource grid.
- Admin save actions update the relevant list sections rather than forcing a full-page reload.
- Resource request search/status filtering is client-side and does not issue another network request.
- Text-only resource forms are opted out of the universal composer; chat/messaging attachments remain enabled elsewhere.
- The public page still needs the API endpoint to be reachable; on API failure it renders an understandable unavailable state rather than inventing resource records.

## Tests run locally

| Test | Result |
|---|---|
| Existing `tools/brightace-regression-test.js` | **PASS — 5/5** |
| Existing `tools/brightace-security-test.js` | **PASS — 11/11** |
| New `tools/brightace-v86-resource-test.js` | **PASS — 26/26** |
| JavaScript syntax checks: backend `.gs`, frontend `.js`, tools, plus inline scripts on the three changed resource pages | **PASS — 52 checks, 0 failures** |
| Duplicate top-level backend function-name scan across `.gs` modules | **PASS — 0 duplicates** |
| ZIP integrity | Verified after packaging: archive opens and all entries pass CRC checks |

These are source/static checks and unit tests for pure validation helpers. They do **not** exercise Google Apps Script services, a real Sheet, Drive permission propagation, Paystack, authenticated client/admin accounts, real uploads/downloads, or payment callbacks.

- A safe, read-only probe of the previously documented production `/exec` endpoint was attempted with one request; it failed with `fetch failed` in this environment, so no live health/version result was obtained.
- A headless Chromium DOM smoke attempt against the local public page timed out in this environment and is **not counted as a pass**.

## Deployment steps

1. **Back up first.** Download/export the currently deployed Apps Script source; make a copy of the bound spreadsheet; preserve the currently deployed website files and the original V85 ZIP.
2. **Update the existing Apps Script project**, not a duplicate deployment. Copy the complete V86 `backend/` source modules, including `Code.gs`, `BA_Resources.gs`, `BA_Security.gs`, `BA_SpreadsheetSchema.gs`, `BA_Files.gs`, and `BA_ThreatDefense.gs`. Keep existing Script Properties and existing Paystack/webhook configuration.
3. Confirm Script Properties contain `SPREADSHEET_ID`, `PAYSTACK_SECRET_KEY`, and `PAYMENT_CALLBACK_URL`. Keep secrets out of website JavaScript.
4. Run `brightAceAlignSpreadsheetSchema()` once in the Apps Script editor. Inspect its result; it should extend the existing `RESOURCE_REQUESTS` tab with quote/payment columns. Do not create a second resource-request sheet.
5. In Drive, verify `RESOURCE_PRIVATE_FOLDER_ID` (if already configured) points to a private folder. If `RESOURCE_PUBLIC_FOLDER_ID` points to a publicly shared folder, replace it with a private folder ID before uploading paid resources. If these properties are absent, the upload flow creates its own folders on first use.
6. Deploy a **new version of the existing Web App**. Preserve the existing `/exec` URL and access settings. Verify `?action=health` returns build `2026-10-12-V86-RESOURCE-MANAGEMENT-DIRECT-UPLOADS-PRICING-PAYMENT-REPAIR` and API `brightace-json-v86`.
7. Publish the changed static files from this package using the current website hosting workflow. Keep `js/brightace-api-config.js` configured for the same deployed `/exec` endpoint.
8. In a **staging** environment, test with a test client and Super Admin: create request, set quote, approve/pay with Paystack test mode, verify paid status, upload a private delivery, download as the owner, and confirm another client is denied. Separately test public promotional media and a published paid catalog item. Check Drive sharing manually.
9. Run the provided V86 resource contract tests locally. Run the existing load probe only against an authorized staging endpoint; it is GET-only and does not simulate upload/payment write traffic.

## Rollback

1. Redeploy the previously deployed Apps Script version and restore the previous website files.
2. Keep all spreadsheet rows and newly appended columns. Do **not** delete the `RESOURCE_REQUESTS` quote/payment columns or resource records during rollback; the old code can ignore extra columns, while deleting them could destroy data written after deployment.
3. Keep uploaded Drive files for review. Do not bulk-delete folders or files during rollback; remove only verified orphaned test uploads after confirming no records reference them.
4. If quote payments were accepted after V86 deployment, reconcile them with Paystack and the corresponding `RESOURCE_REQUESTS` rows before reverting. Never mark or reverse transactions based only on the browser.
5. Verify the previous `/exec` health/version response and perform a read-only website smoke check.

## Explicit limitations / unverified behavior

- No production Google credentials, Sheet, Drive or Apps Script editor access was available in this run; no live deployment or production mutation was performed.
- Paystack transactions, callbacks, webhook delivery, actual Google Drive sharing behavior and Sheets persistence were not live-tested.
- No browser automation framework was installed. Chromium is present, but the attempted headless local DOM smoke timed out; no authenticated end-to-end browser suite was run.
- No staging endpoint was supplied; no concurrency/load test was run. Concurrency safety is improved with locks and idempotency, but contention, Apps Script quotas and high-volume behavior remain unmeasured.
- Apps Script runtime compilation was not available; Node syntax checks do not validate Apps Script service/runtime behavior.
- Private delivery remains limited to 4 MiB and direct uploads to 20 MiB; larger video uploads/resumable transfer are not implemented.
- Quote payments are recorded in `RESOURCE_REQUESTS` and surfaced in admin sales summary. Existing catalog refund automation does not automatically refund quote payments; those require provider-side/manual reconciliation.
- Drive link sharing for published paid catalog files is not DRM. Unpublishing does not automatically revoke existing buyer links because previously purchased users may still rely on them.
- The existing architecture remains Google Apps Script + Sheets + Drive; this package does not establish or certify any particular concurrent-client capacity or production readiness.



## Follow-up upload compatibility and layout patch

- Expanded allowed resource upload MIME types to common image, video, audio, archive, ebook, and office/open-document formats while retaining explicit blocking of active content such as HTML, scripts, and SVG.
- Added filename-extension mappings for common additional formats and signature checks for AVIF, BMP, TIFF, and ICO. This is broad format compatibility, not a guarantee that every proprietary codec or malformed file is accepted.
- Broadened the public media file picker and private-delivery picker to expose the wider supported format set.
- Added fixed minimum column widths, full-width form controls, wrapped filenames, and responsive request-table styling to improve alignment.
- Important: “Unknown BrightAce action” can also indicate the live Apps Script deployment is older than this source. The source router includes `adminUploadResourceFile`; deploy a new Apps Script version and confirm the website API URL targets that deployment.
