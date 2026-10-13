# BrightAce Academy V59 — Resource Admin & Analytics

## Scope
Built directly from V58. This release adds a read-only resource analytics engine and an Admin Resources analytics workspace while preserving the existing public catalog, client library, payments, thumbnails, refunds, reconciliation, and payment-provider abstraction.

## Analytics
- Total resources and published resources
- Paid resource sales count
- Gross paid revenue in USD
- Refunded amount in USD
- Net resource revenue in USD
- Resource access/open events
- Resource download events
- Per-resource performance table
- Revenue and activity grouped by category
- Last access and last download timestamps where available
- Provider shown from the existing provider abstraction

## Data sources
- `RESOURCE_PURCHASES` for sales/revenue/refunds
- `RESOURCE_ACCESS` for access/download counters
- `RESOURCES` for resource metadata and categories

## Safety
Analytics is read-only. It does not create payments, purchases, access records, refunds, or resource changes. Existing Super Admin protection is retained.

## Important interpretation
`accessCount` is the accumulated BrightAce access/open counter, while `downloadCount` is the accumulated download counter. They are not unique-user counts. Historical access rows are aggregate counters, so this release does not fabricate daily/monthly traffic history.

## Deployment
Deploy the backend as a new Apps Script version while keeping the existing production `/exec` URL. The frontend files remain compatible with the same API URL.

## Validation
Static validation performed after build: duplicate top-level function scan, delimiter balance, V59/API markers, analytics function/action presence, permission-map presence, admin analytics UI presence, and ZIP integrity. No live production payment or load test was claimed.


## Follow-up upload compatibility and layout patch

- Expanded allowed resource upload MIME types to common image, video, audio, archive, ebook, and office/open-document formats while retaining explicit blocking of active content such as HTML, scripts, and SVG.
- Added filename-extension mappings for common additional formats and signature checks for AVIF, BMP, TIFF, and ICO. This is broad format compatibility, not a guarantee that every proprietary codec or malformed file is accepted.
- Broadened the public media file picker and private-delivery picker to expose the wider supported format set.
- Added fixed minimum column widths, full-width form controls, wrapped filenames, and responsive request-table styling to improve alignment.
- Important: “Unknown BrightAce action” can also indicate the live Apps Script deployment is older than this source. The source router includes `adminUploadResourceFile`; deploy a new Apps Script version and confirm the website API URL targets that deployment.
