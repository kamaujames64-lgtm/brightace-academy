# BrightAce Academy V61 — Timed Resource Access

V61 is built directly from V60 Resource Access Management. Existing functionality remains intact unless an administrator explicitly configures a resource access duration.

## Added
- Optional `accessDurationDays` on each resource.
- `0` means unlimited access and preserves existing V60 behavior.
- `1–3650` days creates an access expiry for newly granted purchases.
- Manual restore refreshes the access window from the restore time.
- `RESOURCE_ACCESS.expiresAt` records the entitlement expiry.
- Client My Resources displays the expiry when one exists.
- Client open/download endpoints deny expired access.
- Admin Access Management shows expiry and recognizes `EXPIRED`.
- Existing revoke/restore controls remain available.
- Existing payment, refund, reconciliation, analytics, thumbnails, Drive delivery, and payment-provider abstraction remain intact.

## Compatibility
Existing resource rows without `accessDurationDays` are treated as `0` (unlimited). Existing access rows without `expiresAt` remain unlimited.

## Security boundary
This is application-level entitlement control. It does not revoke a Google Drive URL that a buyer may already possess. Stronger per-user signed/expiring file delivery would require a storage/delivery service that supports signed URLs.

## Live testing
No live production mutation test is claimed in this package. After deployment, use a dedicated test resource/payment to verify purchase -> access grant -> expiry -> denial -> admin restore.


## Follow-up upload compatibility and layout patch

- Expanded allowed resource upload MIME types to common image, video, audio, archive, ebook, and office/open-document formats while retaining explicit blocking of active content such as HTML, scripts, and SVG.
- Added filename-extension mappings for common additional formats and signature checks for AVIF, BMP, TIFF, and ICO. This is broad format compatibility, not a guarantee that every proprietary codec or malformed file is accepted.
- Broadened the public media file picker and private-delivery picker to expose the wider supported format set.
- Added fixed minimum column widths, full-width form controls, wrapped filenames, and responsive request-table styling to improve alignment.
- Important: “Unknown BrightAce action” can also indicate the live Apps Script deployment is older than this source. The source router includes `adminUploadResourceFile`; deploy a new Apps Script version and confirm the website API URL targets that deployment.
