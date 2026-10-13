# BrightAce Academy V54 — Disaster Recovery + Data Protection

Build: `2026-09-19-V54-DISASTER-RECOVERY-DATA-PROTECTION`
API: `brightace-json-v54`

## Purpose
V54 adds controlled recovery readiness on top of V53 observability. It does not automatically overwrite production data.

## Added
- `backend/BA_DisasterRecovery.gs`
- protected Super Admin recovery manifest endpoint
- sanitized recovery snapshot endpoint
- Recovery workspace at `pages/admin-recovery.html`
- Admin navigation/workspace link
- V54 deployment markers

## Snapshot safety
Snapshots exclude headers/fields matching password, passcode, secret, token, session, credential, access key, authorization, or API-key patterns. Message bodies are not explicitly selected by the recovery engine. Snapshots are written to an owner Drive folder named `BrightAce Academy Recovery`.

## Recovery behavior
- Integrity manifest is read-only.
- Snapshot creation is explicit and Super Admin protected.
- Snapshot creation never writes back to production Sheets.
- Large sheets are bounded by `recoveryMaxRowsPerSheet` (default 50,000) and report truncation rather than pretending the snapshot is complete.
- Previous snapshot metadata is retained in Script Properties.

## Validation
- Static backend delimiter balance check: PASS
- Frontend JavaScript syntax: PASS
- No duplicate top-level backend function names: PASS
- V53 features retained: PASS
- V51 financial integrity retained: PASS
- V50 security/session hardening retained: PASS
- V49 session recovery retained: PASS
- V48 durable messaging retained: PASS

Live production restore testing requires access to the deployed Apps Script `/exec` and should be performed as a controlled operational exercise; this package does not claim that a live restore has been executed.


## Follow-up upload compatibility and layout patch

- Expanded allowed resource upload MIME types to common image, video, audio, archive, ebook, and office/open-document formats while retaining explicit blocking of active content such as HTML, scripts, and SVG.
- Added filename-extension mappings for common additional formats and signature checks for AVIF, BMP, TIFF, and ICO. This is broad format compatibility, not a guarantee that every proprietary codec or malformed file is accepted.
- Broadened the public media file picker and private-delivery picker to expose the wider supported format set.
- Added fixed minimum column widths, full-width form controls, wrapped filenames, and responsive request-table styling to improve alignment.
- Important: “Unknown BrightAce action” can also indicate the live Apps Script deployment is older than this source. The source router includes `adminUploadResourceFile`; deploy a new Apps Script version and confirm the website API URL targets that deployment.
