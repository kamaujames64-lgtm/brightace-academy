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
