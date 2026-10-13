# V80 — Dedicated Manage Payment Wallet Page and Wallet Population Fix

## Changes
- Removed the embedded “My Payment Wallet & Statements” iframe/card from Earnings & Withdrawals. Earnings & Withdrawals now links to a dedicated wallet page.
- Renamed the dedicated page to **Manage Payment Wallet** and improved the layout with clearer payment-destination, history, and withdrawal sections, responsive form fields, and a visible save action.
- Added **MANAGE PAYMENT WALLET →** to the tutor navigation menu across tutor pages, including the dedicated wallet page.
- Updated Overview's manage-wallet shortcut to open `tutor-wallet.html` directly.
- Fixed the wallet loading dependency: saved wallet details and payment history now load independently of withdrawal history. A failure in `tutorListWithdrawals` no longer prevents the wallet form from being populated.
- Fixed the dynamically created statement download button handler so it is bound after the button is rendered, avoiding a null-element JavaScript error that could stop page initialization.
- Kept the existing `tutorGetWallet`, `tutorSaveWallet`, withdrawal, statement, and backend Google Sheet flows in place; no new wallet storage format was introduced.

## Validation
- Inline JavaScript syntax checked with Node for the updated tutor pages.
- HTML parsing checks confirm a single main page and navigation structure on the checked tutor pages.
- ZIP integrity check performed after packaging.

## Deployment / live verification note
The page changes are packaged, but authenticated browser testing against the live Apps Script deployment and live Google Sheet was not possible in this environment. After deploying, sign in as a tutor and confirm an existing wallet record populates, change and save a payout method, reload the page, and verify the saved record is visible to authorized admins.


## Follow-up upload compatibility and layout patch

- Expanded allowed resource upload MIME types to common image, video, audio, archive, ebook, and office/open-document formats while retaining explicit blocking of active content such as HTML, scripts, and SVG.
- Added filename-extension mappings for common additional formats and signature checks for AVIF, BMP, TIFF, and ICO. This is broad format compatibility, not a guarantee that every proprietary codec or malformed file is accepted.
- Broadened the public media file picker and private-delivery picker to expose the wider supported format set.
- Added fixed minimum column widths, full-width form controls, wrapped filenames, and responsive request-table styling to improve alignment.
- Important: “Unknown BrightAce action” can also indicate the live Apps Script deployment is older than this source. The source router includes `adminUploadResourceFile`; deploy a new Apps Script version and confirm the website API URL targets that deployment.
