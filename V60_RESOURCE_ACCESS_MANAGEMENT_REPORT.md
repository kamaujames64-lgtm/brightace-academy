# BrightAce Academy V60 — Resource Access Management

## Scope
V60 is based directly on V59 and adds operational control for paid resource access without altering payment status.

## Added
- Super Admin purchase/access search.
- Search by purchase ID, provider reference, resource ID/title, buyer name/email/phone.
- Access usage visibility: opens, downloads, last access, last download.
- Manual REVOKE and RESTORE controls for active paid purchases.
- Refunded purchases cannot be restored.
- Client and download access now honor `RESOURCE_ACCESS.accessStatus`.
- Every access-management mutation is audited.
- Existing V59 analytics and all prior resource commerce/library features retained.

## Safety
- Access management does not alter payment amount, refund amount, provider reference, or purchase status.
- Only Super Admin can perform the lookup/mutation endpoints.
- Restoring access is blocked for refunded/revoked-payment purchases.
- Drive sharing/URLs remain unchanged; this is an application-level access gate, not DRM.

## Validation
- ZIP integrity checked.
- Backend function duplication/delimiter checks performed.
- V60 markers and new API actions checked.
- Admin resource page syntax checked.
- Live production mutation tests are not claimed.


## Follow-up upload compatibility and layout patch

- Expanded allowed resource upload MIME types to common image, video, audio, archive, ebook, and office/open-document formats while retaining explicit blocking of active content such as HTML, scripts, and SVG.
- Added filename-extension mappings for common additional formats and signature checks for AVIF, BMP, TIFF, and ICO. This is broad format compatibility, not a guarantee that every proprietary codec or malformed file is accepted.
- Broadened the public media file picker and private-delivery picker to expose the wider supported format set.
- Added fixed minimum column widths, full-width form controls, wrapped filenames, and responsive request-table styling to improve alignment.
- Important: “Unknown BrightAce action” can also indicate the live Apps Script deployment is older than this source. The source router includes `adminUploadResourceFile`; deploy a new Apps Script version and confirm the website API URL targets that deployment.
