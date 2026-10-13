# BrightAce Academy V79 — Tutor Profile, Earnings & Wallet Consolidation

## Changes
- Added a compatibility action `tutorSaveProfessionalProfile` routed to the same authenticated `tutorUpdatePublicProfile_` handler, while retaining the original action. Tutor Settings retries the compatibility action only when the server responds with `Unknown BrightAce action`.
- Kept profile title, description, alternative phone and emergency-contact saves connected to the tutor profile sheet through the existing authenticated backend handler.
- Centralized visible earnings and wallet content on **Earnings & Withdrawals**. The Overview keeps a single navigation card; legacy dashboard finance nodes remain hidden for compatibility with existing dashboard scripts.
- Added a wallet panel to Earnings & Withdrawals that embeds the existing Payment Wallet experience, including payment-method form, Google-Sheet-backed wallet save/load, payment history, statement filters/download, withdrawal request and withdrawal history. The embedded page hides its duplicate header/navigation while preserving the standalone page as a compatible route.
- Both “Manage Payment Wallet” links now target `tutor-earnings.html#payment-wallet`.
- Confirmed the admin Tutor Earnings page already calls the authorized wallet-list action and displays each tutor’s preferred method and relevant payout destination fields. Backend wallet persistence continues to use the existing tutor wallet sheet.

## Important deployment note
The Apps Script backend files were updated in this ZIP. Deploy `backend/Code.gs` and `backend/BA_Security.gs` together as a new Google Apps Script Web App version so the profile compatibility action and wallet/profile changes are available to the live frontend. Do not publish only one of these files.

## Validation
- JavaScript syntax checks performed on updated inline scripts.
- Verified the profile compatibility action is allow-listed and dispatched to the existing authenticated profile update handler.
- Verified both wallet shortcuts target the centralized earnings page.
- Verified the Earnings & Withdrawals page embeds the existing wallet workflow and the admin Tutor Earnings page retains wallet listing.
- ZIP integrity check performed.

No live authenticated account test or Google Sheets write was performed in this environment; verify a profile save and wallet save after deploying the backend.


## Follow-up upload compatibility and layout patch

- Expanded allowed resource upload MIME types to common image, video, audio, archive, ebook, and office/open-document formats while retaining explicit blocking of active content such as HTML, scripts, and SVG.
- Added filename-extension mappings for common additional formats and signature checks for AVIF, BMP, TIFF, and ICO. This is broad format compatibility, not a guarantee that every proprietary codec or malformed file is accepted.
- Broadened the public media file picker and private-delivery picker to expose the wider supported format set.
- Added fixed minimum column widths, full-width form controls, wrapped filenames, and responsive request-table styling to improve alignment.
- Important: “Unknown BrightAce action” can also indicate the live Apps Script deployment is older than this source. The source router includes `adminUploadResourceFile`; deploy a new Apps Script version and confirm the website API URL targets that deployment.
