# BrightAce Academy V73 — Tutor Profile, Wallet & Navigation Improvements

## Starting point
Built from **BrightAce Academy V72 — Profile Visibility & Backend Fix**. Existing application structure, API conventions, login flow, profile cropper, and BrightAce brand assets are retained.

## Changes

### Profile-picture integration
- Kept tutor profile photos integrated with the existing tutor profile storage and cache-invalidation flow.
- Preserved tutor photos in the admin tutor directory and admin dashboard preview.
- Preserved client-facing assigned-tutor photo rendering and added a graceful fallback when an image URL fails.
- Preserved client photos in tutor assigned-work cards and added a fallback instead of leaving an empty image area.
- Added the signed-in admin's saved profile photo to the shared admin header beside the grouped navigation, with a profile-settings link and a fallback icon.
- Profile pictures remain subject to existing role visibility and backend access rules; emergency and alternate contact details are not exposed in public cards.

### Tutor Payment Wallet
- Made the wallet load await the wallet data request so the dashboard doesn't race its own wallet initialization.
- Wallet fetch failures now show a local wallet notice rather than failing the entire tutor dashboard load.
- Existing saved payment settings are retained when the backend returns no wallet object.
- Payment-method-specific fields are shown and marked required: mobile-money provider and number; PayPal email; Payoneer email; or bank name, account name and account number.
- The standalone wallet page applies the same required-field rules and refreshes its field visibility after loading saved values.
- Backend wallet lookup and save now support a single unambiguous legacy wallet row matching the tutor's name if the stored tutor ID changed. Payment history similarly includes exact-name legacy records when IDs differ. Exact tutor ID remains the primary match.
- Server-side wallet validation now requires a mobile-money provider when MOBILE is selected.

### Persistent tutor navigation
- Added a consistent sticky navigation across tutor dashboard, assigned work, admin messages, wallet, and profile/settings pages.
- Navigation includes Overview, Assigned Work, Sessions & Work, Payment Wallet, Earnings & Withdrawals, Admin Messages, Settings, and dashboard logout.
- Added clear active-page styling, high-contrast navy and gold styling, keyboard focus indicators, and horizontal scrolling on narrow screens.

## Validation performed
- JavaScript syntax checks passed for project JavaScript files.
- Backend `.gs` files passed Node syntax parsing when copied to `.js` for the syntax check.
- 49 inline scripts across the HTML pages passed `node --check`.
- Navigation link targets were checked against the project's page files.
- ZIP integrity check passed.

## Limitations / deployment
- No live authenticated browser session or production backend was available for end-to-end testing.
- Backend changes are in `backend/Code.gs`; deploy that file to the existing Google Apps Script Web App as a new version before expecting legacy wallet matching and updated validation to be live.
- This update does not modify payment amounts, payout policy, or withdrawal eligibility.


## Follow-up upload compatibility and layout patch

- Expanded allowed resource upload MIME types to common image, video, audio, archive, ebook, and office/open-document formats while retaining explicit blocking of active content such as HTML, scripts, and SVG.
- Added filename-extension mappings for common additional formats and signature checks for AVIF, BMP, TIFF, and ICO. This is broad format compatibility, not a guarantee that every proprietary codec or malformed file is accepted.
- Broadened the public media file picker and private-delivery picker to expose the wider supported format set.
- Added fixed minimum column widths, full-width form controls, wrapped filenames, and responsive request-table styling to improve alignment.
- Important: “Unknown BrightAce action” can also indicate the live Apps Script deployment is older than this source. The source router includes `adminUploadResourceFile`; deploy a new Apps Script version and confirm the website API URL targets that deployment.
