# BrightAce V35 — Tutor Earnings + Admin History Stability

This repair preserves the existing BrightAce visual design and changes only the requested stability/data presentation.

## Included
- Tutor Earnings data panels now have fixed-height internal scroll areas:
  - Withdrawal requests
  - Outstanding tutor balances
  - Tutor payment wallets
  - Tutor payment history
  - Earnings work detail
- Tutor Earnings requests use a fresh backend read and a GET fallback for read-only data if a deployment/proxy interferes with POST responses.
- Admin History requests use a fresh backend read and a GET fallback.
- Admin History classifies common lifecycle variants (COMPLETED/DONE/FINISHED and REJECTED/DECLINED/CANCELLED) so records populate the appropriate box.
- Existing backend `doPost`/`doGet` JSON error boundaries remain in place.
- `backend/appsscript.json` retains Web App configuration for `USER_DEPLOYING` (Execute as the deploying account / “Me”) and `ANYONE_ANONYMOUS` (Who has access: Anyone).
- No visual redesign or unrelated feature changes were made.

## Deployment
The Google Apps Script Web App itself must be redeployed from the latest `backend/Code.gs` as a new deployment version. Keep the existing production `/exec` URL. The ZIP cannot publish a deployment into the owner's Google account automatically.
