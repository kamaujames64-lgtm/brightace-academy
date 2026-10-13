# V75 — Tutor Fixed Navigation & Responsive Layout

## Scope
Based on BrightAce Academy V74 — Work Assignment Modal Redesign. This update standardizes the tutor navigation bar across tutor dashboard, assigned work, wallet, profile/settings, and messages pages.

## Changes
- Changed the tutor navigation from sticky/in-flow placement to a fixed, full-width top bar so it remains in the same viewport location while scrolling.
- Added consistent deep navy/blue gradient, gold bottom accent, clearly visible white navigation labels, and a gold active-page state.
- Prevented wrapping-induced height changes. Navigation items remain in one horizontal row and can be horizontally scrolled on touch devices.
- Added iOS safe-area top padding, touch-friendly targets, momentum scrolling, responsive spacing for tablets and phones, keyboard focus styles, and reduced-motion support.
- Added scroll-padding so in-page anchor destinations are not hidden behind the fixed navigation.
- Preserved all existing tutor navigation destinations and page functionality.

## Updated pages
- `pages/tutor.html`
- `pages/tutor-work.html`
- `pages/tutor-wallet.html`
- `pages/tutor-profile.html`
- `pages/tutor-messages.html`

## Validation
- Navigation CSS block updated consistently on all 5 tutor pages.
- Checked that existing navigation links remain present.
- Checked for JavaScript syntax errors in the changed pages' external scripts where applicable.
- ZIP integrity check performed after packaging.

## Limitations
No live authenticated browser session or physical Android/iOS/tablet device testing was performed. The responsive rules are implemented, but final device-specific visual confirmation should be completed before production deployment.


## Follow-up upload compatibility and layout patch

- Expanded allowed resource upload MIME types to common image, video, audio, archive, ebook, and office/open-document formats while retaining explicit blocking of active content such as HTML, scripts, and SVG.
- Added filename-extension mappings for common additional formats and signature checks for AVIF, BMP, TIFF, and ICO. This is broad format compatibility, not a guarantee that every proprietary codec or malformed file is accepted.
- Broadened the public media file picker and private-delivery picker to expose the wider supported format set.
- Added fixed minimum column widths, full-width form controls, wrapped filenames, and responsive request-table styling to improve alignment.
- Important: “Unknown BrightAce action” can also indicate the live Apps Script deployment is older than this source. The source router includes `adminUploadResourceFile`; deploy a new Apps Script version and confirm the website API URL targets that deployment.
