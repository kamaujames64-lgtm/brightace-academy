# BrightAce Academy — Foundation Completion

## Scope completed
This package incorporates the requested foundation corrections across Client, Admin, Tutor and General workflows while preserving the existing architecture.

### Client
- Fresh 6-digit WhatsApp verification remains required for new live-chat access.
- Unlimited client WhatsApp numbers are supported; blocked/suspended numbers are rejected with a clear warning.
- Client test WhatsApp: `254725010628` remains the default test number.
- One WhatsApp number maps to one client record.
- Secure client session token with 30-minute inactivity expiry and server-side activity renewal.
- Dashboard aggregates requests, payments, documents, submissions, tutoring sessions, tutor profile information and current work activity.
- Separate Client Payments and Client Tutoring pages.
- Payment URLs are rendered as clickable links.
- Pending payments have secure PAY NOW links.
- Request-specific client feedback is supported.
- Documents include OPEN/DOWNLOAD actions.
- Client/tutor work comments remain inside the website; client↔admin WhatsApp remains separate.
- First verified client sessions receive a one-time usage tutorial popup.
- Client dashboard search highlights matching requests, documents, payments, sessions and messages.
- Client transaction statement download supports date filtering on the dedicated Payments page.

### Admin
- Admin navigation is made visible/consistent across dedicated workspaces.
- Administrator task permissions can be selected per admin; existing admins remain backward compatible until permissions are explicitly configured.
- Client admissions support STANDARD / LOYAL / VIP tiers and discount eligibility.
- Client suspension is enforced at authentication.
- Tutor suspension blocks tutor authentication while preserving the admin record.
- Work assignment payout is 50% tutor / 50% BrightAce.
- Tutor assignment sends tutor payout only to the tutor/admin channel and does not expose the internal allocation to the client.
- Tutor decline/reason workflow returns work to the Admin queue.
- Tutor dashboard preview was optimized to read messages in batches rather than once per work item.
- Admin can delete request/chat history from Work History; financial payment records are intentionally preserved.
- Scheduling no longer blocks appointment creation on tutor availability. Availability is advisory; Admin appointment is authoritative.
- Confirmed appointment/Zoom details are shared with both client and tutor.
- Quality completion requires QA approval and recorded client feedback/satisfaction.
- Admin search is available on the main dashboard.
- Existing payment workspace was left functionally intact apart from supporting 50% tutor calculations.

### Tutor
- Tutor test number remains `0725010628` (normalized to `254725010628`) with test verification code `121212`.
- Profile picture upload remains supported and is displayed using a fitting image treatment.
- Public tutor description is surfaced to clients/admin where available.
- Tutor earnings are consistently calculated at 50% of the qualifying paid agreed amount.
- Tutors do not receive BrightAce gross client-payment totals as their payout figure.
- Withdrawal minimum is KSh 2,000.
- Withdrawal response states that the request was sent successfully and money may reflect within 24 hours after Admin processing.
- Dedicated Tutor Work, Profile & Availability and Admin Messages pages were added.
- Tutor work can be accepted or declined with a reason.
- Tutor work comments support attachments and emoji insertion.
- Tutor transaction statement download supports date filtering on the wallet page.
- Preferred wallet method controls which wallet fields are shown.

### General / performance / security
- Existing header-map cache retained.
- Payment reference lookup retained as server-side column TextFinder rather than full-sheet scan.
- Message-status, conversation and paid-payment lookups were optimized with targeted lookups.
- Admin work/quality lists use short-lived server cache with invalidation after updates.
- Client dashboard uses a short-lived per-client cache and server activity renewal.
- Uploads reject executable/script-like file types and enforce the existing 25 MB limit.
- Dynamic user text is escaped before insertion in the updated interfaces.
- Existing `/exec` endpoint references were aligned to the confirmed BrightAce live endpoint supplied during the project.
- Static HTML links and frontend API action references were audited.

## Validation performed
- Google Apps Script `Code.gs` syntax checked with Node parser: PASS.
- `js/app.js` syntax: PASS.
- `js/chat.js` syntax: PASS.
- All inline JavaScript blocks in HTML pages: PASS (20 checked).
- HTML structural parser: PASS (0 warnings).
- Static local HTML links: PASS (0 missing).
- Frontend API actions vs backend dispatch: PASS (71 frontend actions, 0 missing backend actions).
- Duplicate backend function definitions: PASS (0 duplicates).
- Stale 60% tutor payout references: PASS (none found).
- Stale KSh 3,000 withdrawal references: PASS (none found).
- ZIP integrity is validated after packaging.

## Deployment note
The package is locally implemented and validated. It is **not claimed as deployed or live-tested** from this package build. The confirmed production `/exec` endpoint previously returned build `2026-09-13-PRELAUNCH-1`; deployment of this package requires updating the Apps Script web-app deployment to the new saved Code.gs version, followed by live end-to-end testing.

## Load-capacity note
The existing architecture is Google Sheets + Google Apps Script. The changes reduce unnecessary reads and add caching, but no honest claim of 500 simultaneous production clients is made until an authenticated production/staging load test measures Apps Script, Sheets, WhatsApp and Drive quotas under realistic traffic.
