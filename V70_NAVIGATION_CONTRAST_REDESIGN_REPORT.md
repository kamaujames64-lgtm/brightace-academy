# BrightAce Academy V70 — Navigation Contrast Redesign

## Purpose
Correct the V69 navigation appearance shown in the user's screenshot, where the native `<details>` elements inherited a generic white card style and made the four top-level navigation groups look pale and low-contrast.

## Changes
- Explicitly reset generic site-wide `details` styling on `.ba-admin-nav-group` (background, border, padding, margin, and shadow) so the white cards no longer surround each group.
- Redesigned the four group buttons with deep navy gradients, defined blue borders, bold white labels, gold icon tiles, gold chevrons, and stronger hover/open states.
- Highlighted the active group with a gold border and bottom accent line.
- Improved dropdown panels with a gold top accent, stronger shadow, dark navy text, larger clickable rows, clearer hover styling, and a distinct navy active-page state.
- Preserved the existing BrightAce Academy logo/name, four menu groups, page destinations, click-away behavior, Escape-key behavior, and responsive layout.
- Updated admin-navigation stylesheet cache references from V69 to V70 on 15 admin pages.

## Validation
- Checked that all 15 navigation destinations exist in the project.
- Checked JavaScript syntax with `node --check`.
- Checked ZIP integrity with `unzip -t`.
- Browser-based visual and live-authentication testing were not performed.


## Follow-up upload compatibility and layout patch

- Expanded allowed resource upload MIME types to common image, video, audio, archive, ebook, and office/open-document formats while retaining explicit blocking of active content such as HTML, scripts, and SVG.
- Added filename-extension mappings for common additional formats and signature checks for AVIF, BMP, TIFF, and ICO. This is broad format compatibility, not a guarantee that every proprietary codec or malformed file is accepted.
- Broadened the public media file picker and private-delivery picker to expose the wider supported format set.
- Added fixed minimum column widths, full-width form controls, wrapped filenames, and responsive request-table styling to improve alignment.
- Important: “Unknown BrightAce action” can also indicate the live Apps Script deployment is older than this source. The source router includes `adminUploadResourceFile`; deploy a new Apps Script version and confirm the website API URL targets that deployment.
