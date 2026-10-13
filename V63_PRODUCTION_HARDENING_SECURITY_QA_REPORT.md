# BrightAce Academy V63 — Production Hardening, Security & Full QA Readiness

## Scope
V63 is built directly from V62. It is a release-hardening pass rather than a redesign. Existing client, tutor, admin, payments, resources, messaging, observability, recovery, and timed-resource functionality is retained.

## Completed in this package
- V63 build/API markers and deployment metadata.
- Super Admin `adminProductionReadiness` endpoint for configuration, security, recovery, critical-sheet, trigger, finance, observability, and resource readiness checks.
- Central action allowlists extended to the readiness endpoint.
- Fixed a V62 production-QA defect where timed-resource checks referenced an undefined `out` variable; checks are now counted after all additions.
- Tightened malformed-request and archive-defense limits for the production package: 20 MB request cap, 800 archive-entry cap, 80 MB expanded archive cap, executable/script/VBA blocking, and reserved-key rejection.
- Retained performance indexes/caches while keeping security-sensitive source-of-truth rows authoritative.
- Added a safe GET-only production probe/load-test harness. It does not send passwords, tokens, payments, messages, or other mutations.
- Added a static V63 regression scanner covering deployment markers, action allowlists, security gates, threat defense, recovery redaction, financial integrity, observability, durable messaging, timed resource access, and duplicate function names.

## Manual release gates still required
1. Deploy the package as a new Apps Script version and keep the existing production `/exec` URL.
2. Verify `health` and `version` return JSON and the V63 markers.
3. Confirm required Script Properties/secrets are present without exposing their values.
4. Confirm the message-delivery worker trigger exists.
5. Run dedicated test payments/refunds/withdrawals using test-safe data and the active payment provider.
6. Execute the client → admin → tutor → completion → payment → resource → refund/access lifecycle with test accounts.
7. Create a recovery snapshot and perform a restore rehearsal outside production.
8. Run the included load test from a network that can reach the live `/exec` endpoint. This package does **not** claim a live 500-user result by itself.
9. Perform an independent penetration/security test before public launch.

## Security limitation
Apps Script archive inspection is defensive validation, not a replacement for a commercial antivirus/malware scanning service. Google Drive links also are not equivalent to signed, expiring DRM delivery.


## Follow-up upload compatibility and layout patch

- Expanded allowed resource upload MIME types to common image, video, audio, archive, ebook, and office/open-document formats while retaining explicit blocking of active content such as HTML, scripts, and SVG.
- Added filename-extension mappings for common additional formats and signature checks for AVIF, BMP, TIFF, and ICO. This is broad format compatibility, not a guarantee that every proprietary codec or malformed file is accepted.
- Broadened the public media file picker and private-delivery picker to expose the wider supported format set.
- Added fixed minimum column widths, full-width form controls, wrapped filenames, and responsive request-table styling to improve alignment.
- Important: “Unknown BrightAce action” can also indicate the live Apps Script deployment is older than this source. The source router includes `adminUploadResourceFile`; deploy a new Apps Script version and confirm the website API URL targets that deployment.
