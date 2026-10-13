# BrightAce Academy V86 — Upload Auto-Fit and Client Quote Payment Follow-up

## Changes
- Broadened resource MIME handling for image, video, audio, document, archive and generic downloadable file types. Executable and active web content remains blocked; SVG remains blocked due to active-content risk.
- Updated the admin resource and thumbnail file pickers to accept broad format selection instead of a short hard-coded list.
- Added image auto-fit styling (`object-fit: contain`) to avoid cropping uploaded images in resource previews and client library cards.
- Improved admin request-table spacing, wrapping, borders, hover state, field sizing and mobile horizontal scrolling.
- Made the client quotation price/payment status more prominent and clarified the secure approve-and-pay button. The existing backend `clientApproveResourceQuote` → configured payment provider workflow is reused; no fake payment success was added.

## Limits and verification
- “All formats” cannot be guaranteed universally: codecs, proprietary formats and browser/Drive previews vary. Unknown non-dangerous formats are stored as original downloadable files when their MIME is accepted. SVG, HTML and executable/script formats remain blocked intentionally.
- Existing deployment must be updated for these changes to reach production. Paystack keys, Apps Script deployment, Google Drive folder permissions and end-to-end payment were not tested against live services.
- Resource upload limits remain 20 MiB for catalog/public media and 4 MiB for private client delivery.
