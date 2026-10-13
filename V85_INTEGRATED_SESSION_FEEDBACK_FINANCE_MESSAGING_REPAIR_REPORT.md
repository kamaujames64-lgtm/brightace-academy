# BrightAce Academy V85 — Integrated session, feedback, finance and messaging repair

Release marker: `2026-10-12-V85-INTEGRATED-SESSION-FEEDBACK-FINANCE-MESSAGING-REPAIR`

## Changes
- Admin session booking accepts a pasted official Zoom invite URL (adds `https://` when omitted), validates official HTTPS Zoom hosts and common meeting paths, and gives an actionable validation message. Both admin booking routes require a real Zoom link.
- Scheduling validates date/time format, rejects end times that are not later than start times, and prevents booking in the past.
- Client session displays normalize date/time values; Sheets time serials and 1899-based time-only Date values render as HH:mm rather than misleading 1899 dates.
- Added client satisfaction rating and written feedback form to the client My Tutor & Sessions dashboard. Submissions use the existing authenticated `clientSubmitFeedback` backend route and persist to the conversation record; QA queue now explains where missing feedback must be submitted.
- Tutor payment view reloads immediately after a successful balance payment, with the button disabled during mutation to reduce double submission.
- Existing admin tutor preview already contains distinct Client↔Tutor, Admin↔Client, and Admin↔Tutor panels; preserved these routes and Drive attachment open/download handling.

## Verification limits
Static source checks do not establish live Google Sheets/Drive credentials, deployed Apps Script behavior, Zoom meeting existence, browser rendering across all devices, or 1,000-concurrent-client performance. Deploy to a staging Web App and execute authenticated end-to-end tests before production.


## Follow-up upload compatibility and layout patch

- Expanded allowed resource upload MIME types to common image, video, audio, archive, ebook, and office/open-document formats while retaining explicit blocking of active content such as HTML, scripts, and SVG.
- Added filename-extension mappings for common additional formats and signature checks for AVIF, BMP, TIFF, and ICO. This is broad format compatibility, not a guarantee that every proprietary codec or malformed file is accepted.
- Broadened the public media file picker and private-delivery picker to expose the wider supported format set.
- Added fixed minimum column widths, full-width form controls, wrapped filenames, and responsive request-table styling to improve alignment.
- Important: “Unknown BrightAce action” can also indicate the live Apps Script deployment is older than this source. The source router includes `adminUploadResourceFile`; deploy a new Apps Script version and confirm the website API URL targets that deployment.
