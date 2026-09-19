# V56 — Google Drive Resource Commerce

## What V56 adds
- Public Resources page now loads published resources from Apps Script while remaining lightweight/static in presentation.
- Admin Resources workspace for creating, editing, publishing and removing resource records.
- Google Drive file IDs are kept server-side; unpaid browsers never receive them.
- Every resource has a price stored in USD.
- Public checkout collects buyer name/email and initializes Paystack in USD.
- Payment verification checks amount and currency before marking a resource purchase paid.
- After verified payment, the buyer receives the Google Drive file URL.
- Existing V44–V55 payment, messaging, wallet, observability, recovery and QA systems are retained.

## How to add a resource
1. Upload the PDF/document/video/resource to Google Drive.
2. In Drive, use **Share → General access → Anyone with the link → Viewer** for a public paid-download resource. BrightAce deliberately does not change Drive permissions automatically.
3. Copy the file ID from the Drive URL.
4. Sign in as Super Admin and open **Admin → Resources**.
5. Click **ADD RESOURCE**.
6. Enter title, category, description, price in USD, Drive file ID, access level, and publication status.
7. Save and publish.
8. Visit the public Resources page and verify the displayed price and checkout.

## Important payment setup
- Paystack must support USD for the configured merchant account/environment.
- `PAYSTACK_SECRET_KEY` remains in Apps Script Script Properties only.
- `PAYMENT_CALLBACK_URL` should point to `pages/resource-checkout.html` (or the existing payment callback if you prefer a shared callback route).

## Delivery/security note
The V56 checkout verifies the transaction server-side and only then returns the Drive link. Because Google Drive itself controls file access, a file intended for public buyers must be shared as **Anyone with the link — Viewer**; the payment gate is the BrightAce purchase flow, not a permanent DRM system. Do not use this method for highly confidential files.

## No design replacement
V56 keeps the existing BrightAce navigation, typography, cards and public page structure. The Resources cards now use live catalog data instead of six static placeholders.
