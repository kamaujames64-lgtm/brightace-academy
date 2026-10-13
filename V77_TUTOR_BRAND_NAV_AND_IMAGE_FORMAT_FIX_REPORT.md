# BrightAce Academy V77 — Tutor Brand Navigation & Profile Image Format Fix

## Starting point
Built from **BrightAce Academy V76 — Tutor Navigation & Mobile Money Fix**.

## Changes
- Combined the BrightAce Academy logo, wordmark, and tutor navigation into one fixed top bar across the five tutor pages: Overview, Assigned Work, Earnings & Withdrawals / wallet, Admin Messages, and Settings.
- Kept the brand at the left edge of the fixed bar while the navigation links scroll horizontally within their own area on smaller screens. Added tablet/mobile sizing and safe-area padding.
- Removed the separate, scrolling tutor page headers so the brand is not duplicated and stays aligned with the navigation.
- Removed duplicate navigation actions, including the extra dashboard Log out and Payment Wallet controls on the overview page and the redundant Tutor Dashboard links on the wallet/settings page. The wallet remains accessible from Earnings & Withdrawals via Manage Payment Wallet.
- Kept the upload control accepting `image/*`; the existing browser-based cropper normalizes browser-decodable source images to JPEG before upload.
- Fixed the backend image signature validator to normalize Apps Script signed bytes to unsigned octets before checking JPEG/PNG/GIF/WEBP signatures. This addresses false rejection of valid JPEGs with the message “The selected file is not a valid JPEG image.” The same validator is used by tutor and admin profile uploads.

## Validation
- JavaScript syntax checks passed for `js/brightace-profile-cropper.js`, `backend/Code.gs`, and ordinary inline scripts across all five tutor pages.
- Confirmed the same seven navigation controls are present on each tutor page.
- Confirmed the old scrolling tutor header is removed from all five pages.
- Confirmed backend image-signature validation includes unsigned-byte normalization.
- ZIP integrity test passed.

## Notes / limits
- The uploader accepts image types the browser can decode and normalizes them to JPEG. Some formats (for example HEIC/HEIF on browsers without native support) may still need conversion before selection.
- No live authenticated upload or physical Android/iOS device test was performed. Deploy updated `backend/Code.gs` to the existing Apps Script Web App as a new version for the server-side validation fix to take effect.


## Follow-up upload compatibility and layout patch

- Expanded allowed resource upload MIME types to common image, video, audio, archive, ebook, and office/open-document formats while retaining explicit blocking of active content such as HTML, scripts, and SVG.
- Added filename-extension mappings for common additional formats and signature checks for AVIF, BMP, TIFF, and ICO. This is broad format compatibility, not a guarantee that every proprietary codec or malformed file is accepted.
- Broadened the public media file picker and private-delivery picker to expose the wider supported format set.
- Added fixed minimum column widths, full-width form controls, wrapped filenames, and responsive request-table styling to improve alignment.
- Important: “Unknown BrightAce action” can also indicate the live Apps Script deployment is older than this source. The source router includes `adminUploadResourceFile`; deploy a new Apps Script version and confirm the website API URL targets that deployment.
