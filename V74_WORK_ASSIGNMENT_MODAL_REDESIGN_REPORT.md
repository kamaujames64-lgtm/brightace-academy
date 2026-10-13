# BrightAce Academy V74 — Work Assignment Modal Redesign

## Scope
Updated the shared assignment detail/editor modal on `pages/admin-assignments.html`, used for every request opened from Admin → Work Assignments → Active Work.

## Design changes
- Replaced the compact, plain modal with a wide, responsive BrightAce navy header and gold accent.
- Enlarged the request title, assignment ID, status metadata, field labels, and input controls.
- Added a clear visual hierarchy for responsible admin, tutor, client budget, deadline, work description, and optional assignment documents.
- Added a prominent gold Assign/Reassign Tutor action and improved hover/focus states.
- Made the modal responsive: fields stack on narrow screens and the editor remains scrollable within the viewport.
- Improved the close button and overlay appearance.

## Functionality preserved
- Existing request selection and assignment data population.
- Existing admin and tutor dropdowns.
- Existing read-only budget, deadline, and work description fields.
- Existing assignment attachment handling and size/count limits.
- Existing `adminAssignWork` backend action and success/error notifications.
- Since every work request uses the same `select()` function and modal markup, the design applies to all requests opened on this page, not only one client.

## Validation performed
- Inline JavaScript syntax checks passed with Node.js.
- ZIP archive integrity check passed.
- Verified the modal contains all expected controls and preserves existing API action names.

## Not performed
- No live browser visual test or authenticated backend assignment was performed.
- No production deployment was performed.


## Follow-up upload compatibility and layout patch

- Expanded allowed resource upload MIME types to common image, video, audio, archive, ebook, and office/open-document formats while retaining explicit blocking of active content such as HTML, scripts, and SVG.
- Added filename-extension mappings for common additional formats and signature checks for AVIF, BMP, TIFF, and ICO. This is broad format compatibility, not a guarantee that every proprietary codec or malformed file is accepted.
- Broadened the public media file picker and private-delivery picker to expose the wider supported format set.
- Added fixed minimum column widths, full-width form controls, wrapped filenames, and responsive request-table styling to improve alignment.
- Important: “Unknown BrightAce action” can also indicate the live Apps Script deployment is older than this source. The source router includes `adminUploadResourceFile`; deploy a new Apps Script version and confirm the website API URL targets that deployment.
