# BrightAce Academy V69 — Sticky Brand Header Navigation

## Requested changes implemented

- Integrated the four grouped admin navigation menus into the existing sticky site header, immediately to the right of the retained BrightAce Academy logo and brand name.
- Removed the generated `Admin Workspace` / `BRIGHTACE ACADEMY` brand block from the grouped navigation.
- Removed the extra admin-top-label from the header at runtime so the existing academy brand remains the only header branding.
- Preserved the four groups and their current destination links: Overview, People & Delivery, Finance & Records, and System.
- Increased navigation labels and dropdown link text for comfortable readability, with navy/blue surfaces, gold active-state accents, white dropdown panels, refined spacing, and visible keyboard focus.
- Kept responsive layouts for tablet and mobile. The site header's existing sticky positioning keeps the logo and grouped navigation at the top while scrolling.
- Bumped the shared admin-navigation CSS/JS cache version to `20261011-v69` on admin pages.

## Validation

- `node --check js/admin-navigation.js` passed.
- All grouped navigation destination HTML files exist.
- Confirmed the generated navigation no longer contains the Admin Workspace / BRIGHTACE ACADEMY brand block.
- Browser visual, live sign-in, and production deployment tests were not performed.


## Follow-up upload compatibility and layout patch

- Expanded allowed resource upload MIME types to common image, video, audio, archive, ebook, and office/open-document formats while retaining explicit blocking of active content such as HTML, scripts, and SVG.
- Added filename-extension mappings for common additional formats and signature checks for AVIF, BMP, TIFF, and ICO. This is broad format compatibility, not a guarantee that every proprietary codec or malformed file is accepted.
- Broadened the public media file picker and private-delivery picker to expose the wider supported format set.
- Added fixed minimum column widths, full-width form controls, wrapped filenames, and responsive request-table styling to improve alignment.
- Important: “Unknown BrightAce action” can also indicate the live Apps Script deployment is older than this source. The source router includes `adminUploadResourceFile`; deploy a new Apps Script version and confirm the website API URL targets that deployment.
