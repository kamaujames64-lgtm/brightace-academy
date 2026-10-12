# V78 — Tutor Profile Persistence, Independent Pages & Mobile Money Fields

## Changes
- Profile picture persistence hardened: profile reads can bypass the dashboard cache; the dashboard keeps a known-good photo if a transient refresh returns an empty URL; tutor profile lookups can reconstruct the thumbnail URL from the stored Drive file ID.
- Profile image uploads now explicitly request and verify Anyone-with-the-link viewer access. If the Drive sharing policy blocks access, the upload reports a clear error instead of pretending the image will be visible to other users.
- Tutor navigation now routes Sessions & Work and Earnings & Withdrawals to their own independent pages (`tutor-sessions.html`, `tutor-earnings.html`) rather than jumping to anchors in the dashboard.
- Added standalone Sessions & Work and Earnings & Withdrawals pages using existing tutor dashboard/session/withdrawal APIs.
- Reworked mobile-money payment field visibility to use a dedicated `data-wallet-field` mapping and the HTML `hidden` property, with `!important` CSS so existing styles cannot accidentally hide fields permanently. Provider and preferred number are required when Mobile Money is selected.

## Validation
- JavaScript syntax checks, HTML navigation checks, backend static checks and ZIP integrity test performed locally.
- No live authenticated browser, Google Drive policy, or production backend test was performed. Deploy the updated `backend/Code.gs` as a new Apps Script Web App version for backend changes to take effect.
