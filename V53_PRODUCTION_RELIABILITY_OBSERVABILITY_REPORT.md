# BrightAce Academy V53 — Production Reliability + Observability

## Base
Built directly from V52 — Frontend + Mobile Performance.

## Purpose
V53 adds operational visibility without changing customer-facing business workflows. It records only failure diagnostics and safe operational metadata.

## Reliability features
1. Structured API failure classification: AUTH_ERROR, RATE_LIMIT, PAYMENT_ERROR, DELIVERY_ERROR, DATA_ERROR, TIMEOUT, SERVER_ERROR.
2. Protected operational event sheet for recent failures.
3. Lightweight cache counters for request/error activity.
4. Health metadata for build, API marker, last error and durable delivery-worker heartbeat.
5. Admin-only System Health workspace.
6. Durable messaging worker heartbeat and error visibility.

## Privacy boundary
Operational events redact URLs, phone-like values and credential/token fields. Message bodies and secrets are not written to the event log.

## Preserved
V47 complete client history; V48 durable messaging and tutor wallet session handoff; V49 client session recovery; V50 security/session hardening; V51 financial reconciliation; V52 visibility-aware frontend/mobile scheduler.

## Limitation
No production 500-user load result is claimed unless the deployed `/exec` is actually reachable and tested.


## Follow-up upload compatibility and layout patch

- Expanded allowed resource upload MIME types to common image, video, audio, archive, ebook, and office/open-document formats while retaining explicit blocking of active content such as HTML, scripts, and SVG.
- Added filename-extension mappings for common additional formats and signature checks for AVIF, BMP, TIFF, and ICO. This is broad format compatibility, not a guarantee that every proprietary codec or malformed file is accepted.
- Broadened the public media file picker and private-delivery picker to expose the wider supported format set.
- Added fixed minimum column widths, full-width form controls, wrapped filenames, and responsive request-table styling to improve alignment.
- Important: “Unknown BrightAce action” can also indicate the live Apps Script deployment is older than this source. The source router includes `adminUploadResourceFile`; deploy a new Apps Script version and confirm the website API URL targets that deployment.
