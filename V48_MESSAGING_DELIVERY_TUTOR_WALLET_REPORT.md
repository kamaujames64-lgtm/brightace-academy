# BrightAce Academy V48 — Messaging Delivery + Tutor Wallet Session

Base: V47 Client History + 500-User Readiness.

## V48 changes
- Added durable `MESSAGE_DELIVERY_QUEUE` in Apps Script/Google Sheets.
- Admin-to-client messages now create a durable delivery record instead of relying on a 120-second cache entry.
- Tutor-to-admin WhatsApp messages now create a durable queue record, attempt delivery immediately, and retain retry/dead-letter state.
- Delivery records are idempotent by queue ID and use bounded exponential retry timing.
- Added a 1-minute Apps Script trigger installer: `baInstallMessageDeliveryTrigger_()`.
- Preserved existing chat UI and message storage.
- Hardened tutor Payment Wallet navigation so an already authenticated tutor carries the canonical session into the wallet page and is not unnecessarily sent back to verification.
- Wallet page now hides the sign-in panel while a valid canonical token is being checked and performs one additional canonical-storage recovery before forcing sign-in.
- Updated deployment/build markers to V48 / `brightace-json-v48`.
- Added `tools/brightace-v48-audit.js`.

## Deployment
Deploy all `backend/*.gs` files as a new version of the SAME Apps Script Web App and keep the existing `/exec` URL.

For the delivery worker, run `baInstallMessageDeliveryTrigger_()` once from the Apps Script editor after deployment. The trigger runs every minute and processes up to 15 due messages per cycle.

## Important limitation
This package includes the V48 load/readiness engineering, but no claim is made that a real 500-user production stress test has been executed. A live test requires network access to the deployed `/exec` endpoint.
