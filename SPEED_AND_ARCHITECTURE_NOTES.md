# BrightAce Academy — Speed & Communication Overhaul

This package is based on the uploaded BrightAce Academy project.

## Speed changes
- New-client creation no longer waits for WhatsApp OTP delivery.
- Verification UI opens immediately after the conversation record is created.
- OTP delivery is a separate request with a short resend cooldown.
- Entering the sixth OTP digit automatically verifies and opens the chat.
- Student chat messages are persisted first and rendered immediately; WhatsApp delivery is queued as a separate background browser request.
- Admin replies are persisted/rendered immediately; WhatsApp delivery is a separate browser request.
- Payment-request creation no longer waits for WhatsApp delivery; the secure payment link is available immediately.
- Conversation and recent-message caching reduces repeated Google Sheets scans.
- Admin background polling is lighter: conversations/tutors are refreshed separately from slower payment/refund/balance panels.
- The admin chat workspace uses the available horizontal space instead of leaving a large empty right side.

## Communication/security architecture
- The client has one BrightAce messaging experience.
- Client messages are routed to the BrightAce admin WhatsApp number, not directly to an assigned tutor.
- Tutors can be contacted by Admin from the tutor area, but the client's website does not expose the tutor's private WhatsApp number.
- Payments remain BrightAce-controlled and are not routed through tutor WhatsApp.
- Tutor budget/BrightAce-share details remain admin-side.
- Optional `ADMIN_USERS_JSON` supports multiple named admin logins while preserving the existing `ADMIN_PASSWORD` owner login as a fallback.

## Contact
- Contact links now open the configured BrightAce admin email directly using a `mailto:` link.
- The Apps Script contact-email fallback to `Session.getEffectiveUser()` has been removed. `sendContactEmail_` now requires `CONTACT_EMAIL` (or `ADMIN_EMAIL`) in Script Properties.

## History page
- `pages/admin-history.html` was intentionally preserved byte-for-byte from the uploaded ZIP.

## Deployment
- Do not push this package to GitHub until it has been tested.
- Replace/deploy the Apps Script `Code.gs` from this package as a new Web App version while keeping the existing deployment URL.
- Do not change the existing production WhatsApp phone number, Phone Number ID, WABA, or stored production token.

## Final admin workspace structure
- Main Dashboard is intentionally limited to active client requests, the BrightAce WhatsApp wall, assignment control, and operational status cards.
- Tutors, Payments, Tutor Earnings and Admin Team are separate top-level admin workspaces.
- Client messages render on the right; BrightAce Admin messages render on the left.
- Tutor messages are stored in `TUTOR_MESSAGES` and are excluded from the client-facing conversation. This prevents client ↔ tutor leakage.
- Existing attachment records are hydrated with Google Drive download URLs so older attachments receive working download controls too.
- Admins can have a WhatsApp number and duties recorded in `ADMIN_USERS_JSON`.
- Optional per-admin Meta sender configuration can be stored using Script Properties named `ADMIN_WA_PHONE_<username>`, `ADMIN_WA_PHONE_ID_<username>`, and `ADMIN_WA_TOKEN_<username>`. If these are not configured, the production BrightAce sender remains the fallback.
- Website student messages can be routed to the responsible admin's recorded WhatsApp number for operational notification.
- The production web-app endpoint currently wired into the package is the endpoint supplied by the project owner on 2026-09-09.


### 2026-09-11 final pre-publication frontend load tuning
- Client live-chat polling: 30 seconds.
- Tutor dashboard polling: 30 seconds.
- Admin polling/selected conversation polling: 30 seconds.
- Client Dashboard polling: 30 seconds.
- Message endpoint already uses Apps Script CacheService for conversation messages (5-minute cache, updated when messages are saved), reducing repeated Sheet scans.
- These changes reduce steady-state polling traffic substantially versus 15-second polling. They should be load-tested before claiming a hard 700-concurrent-user guarantee.
