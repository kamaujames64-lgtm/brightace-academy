# BrightAce Academy V44 — Comprehensive Financial Statement + Scalability Continuation

V44 is based directly on V43 and preserves the existing client, tutor, admin, chat, payment and dashboard interfaces.

## Financial statement correction

The Owner/Main Admin transaction statement now includes the complete recorded cash-movement view for the selected date range:

- CLIENT PAYMENT — money received from a client.
- CLIENT REFUND — approved refunds actually processed to a client. Pending/rejected refund requests are excluded because they are not completed cash transactions.
- TUTOR PAYMENT — money actually recorded as paid to a tutor.
- PAID tutor withdrawals without a matching payment-history reference are included as a fallback.

Tutor withdrawal records that already have a matching tutor payment-history reference are not counted twice.

The PDF now shows IN/OUT direction and, for the Owner statement, received, paid-out and net amounts when supplied.

## Integrity

The transaction list returned by registerStatement remains part of the canonical statement payload and integrity hash. The additional transaction categories therefore participate in the existing statement reference/integrity verification flow.

## Deployment

Deploy the complete V44 backend set, including Code.gs and all BA_*.gs modules, as a new version of the existing Apps Script Web App. Replace the frontend files from this package. Keep the existing /exec URL and Script Properties.

## Validation note

This pass was validated statically against the V43 package. A live production 500-user load result is not claimed unless the deployed /exec endpoint is reachable from the test environment.


## Follow-up upload compatibility and layout patch

- Expanded allowed resource upload MIME types to common image, video, audio, archive, ebook, and office/open-document formats while retaining explicit blocking of active content such as HTML, scripts, and SVG.
- Added filename-extension mappings for common additional formats and signature checks for AVIF, BMP, TIFF, and ICO. This is broad format compatibility, not a guarantee that every proprietary codec or malformed file is accepted.
- Broadened the public media file picker and private-delivery picker to expose the wider supported format set.
- Added fixed minimum column widths, full-width form controls, wrapped filenames, and responsive request-table styling to improve alignment.
- Important: “Unknown BrightAce action” can also indicate the live Apps Script deployment is older than this source. The source router includes `adminUploadResourceFile`; deploy a new Apps Script version and confirm the website API URL targets that deployment.
