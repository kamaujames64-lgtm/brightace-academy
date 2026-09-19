# V63 Production Hardening

Built directly from V62. This release focuses on production security, operational readiness, QA correctness, recovery checks, and safe load-test tooling while preserving existing functionality/design. See `V63_PRODUCTION_HARDENING_SECURITY_QA_REPORT.md`.


# V62 — SPEED + SECURITY HARDENING

V62 is built directly from V61. It adds hot-path caching/indexes, request-size guards, archive/Office upload inspection, stronger action allowlists, and cache invalidation while preserving the existing BrightAce UI and business workflows.

# V61 — Timed Resource Access

V61 is built directly from V60. It retains V60 access management, V59 resource analytics, V58 student resource library, thumbnails, USD commerce, refunds, reconciliation, disaster recovery, and payment-provider abstraction.

V61 adds optional resource access-duration policies. Admins can set access duration to 0 (unlimited) or 1–3650 days. New paid purchases receive an expiry when a duration is configured; manual restore refreshes the expiry window. Existing resources remain unlimited until an admin chooses a duration. Client resource access, download access, My Resources, and Admin Access Management all honor the expiry.

Build marker: `2026-09-19-V61-TIMED-RESOURCE-ACCESS`
JSON API marker: `brightace-json-v61`

# V60 — Resource Access Management

V60 is built directly from V59. It retains the V59 resource analytics, V58 student resource library, thumbnails, USD commerce, refunds, reconciliation, disaster recovery, and payment-provider abstraction.

V60 adds Super Admin resource-purchase access management: search resource purchases by buyer/resource/purchase/reference, inspect access usage, temporarily revoke access without changing payment status, and restore access for active paid purchases. Refunded purchases remain non-restorable. Client and download access checks now honor the RESOURCE_ACCESS accessStatus.

Build marker: `2026-09-19-V60-RESOURCE-ACCESS-MANAGEMENT`
JSON API marker: `brightace-json-v60`

No payment records are changed by access-management actions. Every revoke/restore action is audited.

# V59 — Resource Admin & Analytics

V59 is built directly from V58 and adds read-only resource sales/access/download analytics to the Admin Resources workspace. Existing V58 resource commerce, student library, thumbnails, refunds, reconciliation, disaster recovery, and payment-provider abstraction are retained.

# BrightAce Academy V58 — Student Resource Library

V58 continues from V57. It adds the student resource-library/discovery layer: catalog search, category filtering, sorting, verified-client purchase recognition, My Resources filtering, and continued thumbnail visibility.

Build marker: `2026-09-19-V58-STUDENT-RESOURCE-LIBRARY`
JSON API marker: `brightace-json-v58`

See `V58_STUDENT_RESOURCE_LIBRARY_REPORT.md` for the implementation and validation summary.

---

# BrightAce Academy — V57 Resource Commerce + Secure Access

# V57 — Resource Commerce + Secure Access

## Added
- Small Drive-backed thumbnail image for each resource, shown on public Resources, checkout, Admin Resources, and My Resources.
- Resource purchase history and verified My Resources library.
- Purchase-to-client linking using verified WhatsApp phone and/or client email.
- Duplicate paid-purchase prevention.
- Access/open/download audit records in `RESOURCE_ACCESS`.
- Admin sales/revenue workspace with paid, refunded and net USD totals.
- Resource refund workflow and access revocation for full refunds.
- Resource purchase reconciliation checks.
- Payment-provider abstraction (`BRIGHTACE_RESOURCE_PAYMENT_PROVIDER`, current provider `PAYSTACK`) so future provider replacement is isolated to the provider adapter.
- Resource sheets included in disaster-recovery critical data set.
- Paystack webhook recognizes resource purchases as well as existing BrightAce service payments.

## Thumbnail setup
Upload a small JPG/PNG/WEBP image to Google Drive, then enter its Drive file ID in Admin → Resources → Thumbnail image Drive file ID. The image is used only for visual identification; the actual paid resource file remains separately controlled.

## Access model
A verified client can see paid resources in My Resources and request an access/download URL through the backend. Full refunds revoke BrightAce access. Google Drive sharing still controls the final file itself; this remains a payment/access gate rather than DRM.

## Payment-provider independence
The resource commerce layer calls provider-neutral functions for initialize, verify and refund. Current production configuration remains Paystack through `BRIGHTACE_RESOURCE_PAYMENT_PROVIDER=PAYSTACK`. A future provider can replace that adapter without changing the resource catalog, thumbnail system, purchase records, My Resources UI, or core reconciliation model.

## Existing design preserved
V57 keeps the BrightAce navigation, typography, card system and existing resource workflow intact. The new thumbnail is intentionally small and visual, not a redesign of the Resources page.


# BrightAce Academy V56 — Google Drive Paid Resources

V56 adds a Google Drive-backed resource catalog with USD pricing and Paystack checkout while preserving the existing BrightAce public design and V55 production systems. See `V56_GOOGLE_DRIVE_PAID_RESOURCES_REPORT.md` for setup and resource-adding instructions.

# V55 — Full End-to-End QA / Production Readiness

Build: `2026-09-19-V55-END-TO-END-QA-PRODUCTION-READINESS`  
API: `brightace-json-v55`

V55 continues directly from V54 and adds a protected Super Admin Production QA workspace, read-only backend readiness checks, workflow coverage, and an offline static package audit. It does not change the existing customer-facing design or deliberately run production mutation tests.

See `V55_END_TO_END_QA_PRODUCTION_READINESS_REPORT.md`.

---

## V54 — Disaster Recovery + Data Protection
Build: `2026-09-19-V54-DISASTER-RECOVERY-DATA-PROTECTION`

V54 adds protected Super Admin integrity checks and sanitized recovery snapshots without automatic production overwrite.

# V53 — Production Reliability + Observability

Build: `2026-09-19-V53-PRODUCTION-RELIABILITY-OBSERVABILITY`  
API marker: `brightace-json-v53`

V53 is based directly on V52. It preserves the V52 visibility-aware scheduler, V51 financial reconciliation, V50 security/session hardening, V49 session recovery, V48 durable messaging, and V47 complete client request history.

### V53 changes
- Added `backend/BA_Observability.gs` for protected operational diagnostics.
- Failed API/trigger operations are categorized and persisted without storing message bodies, credentials, access tokens, phone numbers, or payment secrets.
- Health metadata now exposes build/API identity and delivery-worker heartbeat.
- Added protected `adminObservability` API action.
- Added Admin **System Health** workspace with API, delivery queue, worker and recent-failure visibility.
- Delivery worker now records last run/status/processed count.
- Existing durable message delivery queue remains unchanged in behavior.

### Deployment
Deploy the complete `backend/` folder as a new version of the same Apps Script Web App and keep the existing `/exec` URL. Verify `?action=health` returns the V53 build and `brightace-json-v53`.

See `V53_PRODUCTION_RELIABILITY_OBSERVABILITY_REPORT.md`.
# V52 — Frontend + Mobile Performance

Build: `2026-09-19-V52-FRONTEND-MOBILE-PERFORMANCE`  
API marker: `brightace-json-v52`

V52 is based directly on V51 and keeps the existing BrightAce design and business workflows intact. It replaces page-level polling intervals with a visibility-aware scheduler that pauses hidden tabs, prevents overlapping refreshes, and refreshes when users return to a workspace.

### V52 changes
- Adds `BrightAceScheduler` to `js/app.js`.
- Removes page-level `setInterval` polling from the major client, tutor, and admin workspaces.
- Pauses background polling while tabs are hidden.
- Refreshes once when a user returns to a visible workspace.
- Adds an in-flight guard to prevent overlapping refresh requests.
- Normalizes high-frequency polling to reduce unnecessary API pressure.
- Keeps form-focus protections and existing UI behavior.

### Validation
- V52 frontend/mobile performance audit: `tools/brightace-v52-audit.js`.
- Production 500-user load results are not claimed unless the deployed `/exec` is reachable and the test is actually executed.

### Deployment
Deploy the complete `backend/` folder as a new version of the **same** Apps Script Web App and keep the existing `/exec` URL. Verify `?action=health` returns the V52 build and `brightace-json-v52`.

See `V52_FRONTEND_MOBILE_PERFORMANCE_REPORT.md`.

---

# V51 — Financial Integrity + Reconciliation

Build: `2026-09-19-V51-FINANCIAL-INTEGRITY-RECONCILIATION`  
API marker: `brightace-json-v51`

V51 is based directly on V50 and preserves the V47/V48/V49/V50 client history, durable messaging delivery, tutor wallet session handoff, and client session security work.

### V51 changes
- Adds a read-only Admin financial integrity/reconciliation endpoint: `adminFinancialIntegrity`.
- Reconciles confirmed client payments, approved refunds, tutor payouts, tutor payment history, and paid withdrawals by currency.
- Detects duplicate processor/payment references, orphaned paid withdrawals, payout/history total mismatches, negative ledger values, payout remaining-balance mismatches, refunds against unpaid payments, currency mismatches, and refunds exceeding the original payment.
- Flags paid client payments, approved refunds, and paid withdrawals that are missing required processor references.
- Fixes an important mutation-order issue in `adminMarkTutorBalancePaid`: duplicate payment-reference validation now occurs **before** payout ledger rows are modified.
- The reconciliation engine is strictly read-only; it does not automatically rewrite financial records.

### Validation
- V51 financial integrity audit is included at `tools/brightace-v51-audit.js`.
- The production 500-user load test is not claimed unless the deployed `/exec` is reachable and the test is actually executed.

### Deployment
Deploy the complete `backend/` folder as a new version of the **same** Apps Script Web App and keep the existing `/exec` URL. Verify `?action=health` returns JSON with the V51 build and `brightace-json-v51`.

---

# BrightAce Academy V50

Built from V49 (`2026-09-19-V49-CLIENT-SESSION-RECOVERY-MESSAGING-WALLET`). V50 hardens client-session recovery across the dashboard and Live Chat, removes the remaining legacy `verificationStatus` session boundary, adds controlled message-sync recovery, and adds a 16-check security/abuse release audit.

See `V50_SECURITY_ABUSE_SESSION_HARDENING_REPORT.md`.

# BrightAce Academy V49

Built from V48. V49 fixes client session recovery so a legitimate returning client is not unnecessarily forced through WhatsApp verification again when the browser has a stale/rotated short-lived session token but still holds a valid per-request client access token.

See `V49_CLIENT_SESSION_RECOVERY_MESSAGING_WALLET_REPORT.md`.
# BrightAce Academy — V48

V48 is based on V47 Client History + 500-User Readiness. It adds durable WhatsApp/message delivery state with bounded retries and hardens tutor Payment Wallet navigation so an already authenticated tutor opens the wallet without being unnecessarily sent through tutor verification again.

Deploy the full `backend/` folder as a new version of the same Apps Script Web App and keep the existing `/exec` URL. After deployment, run `baInstallMessageDeliveryTrigger_()` once in Apps Script to install the one-minute delivery worker.

The package does not claim a real 500-user production stress test has been executed.

# BrightAce Academy v15 — Admin Chat + Selection + Notification Fix

Targeted patch based on v14. Replace only backend/Code.gs, pages/admin.html, and add css/admin-chat.css.

Fixes:
- Admin request/tutor selections persist during polling instead of resetting.
- Admin can open a request and chat with the student before assigning work.
- Admin messages are stored in MESSAGES and sent to the student's WhatsApp when configured.
- Selected conversation chat auto-refreshes.
- Added explicit sound-test control and stronger browser-audio unlock path.
- Tutor financial privacy remains unchanged.

The public pages/SEO files are untouched by this patch.

The supplied ChatGPT shared link could not be retrieved as an image asset; upload the intended photo before adding it as the global static background.


## v17 additions
- Hardened student request submission so saved requests are not lost if WhatsApp notification fails.
- Persists the start form draft until the request is successfully created.
- Improved Drive attachment links for admin/student viewing and downloading.
- Added student refund request form with reason and optional amount/payment request ID.
- Added Admin Refund Requests section with approve/reject workflow; approved KES/USD refunds can be submitted to Paystack when a verified transaction reference is available. EUR requests are recorded for manual review.
- Made the Admin ↔ Tutor WhatsApp section explicit and visible.

## WhatsApp verification formatting
WhatsApp verification uses the existing BrightAce WhatsApp sender configuration (`META_ACCESS_TOKEN` and `META_PHONE_NUMBER_ID`) and does not require any additional OTP Script Property. The verification message is sent through the existing free-form WhatsApp text path.

## Current production Apps Script endpoint wired into this package
`https://script.google.com/macros/s/AKfycbzwomGZZZwzKCCAEVhFo9OBTkgz_aKNA6DyO7cIYh_cN8g90e-8dCPl18Bs5XxaH13u/exec`

## Important deployment note
The static website package can be fully prepared here, but a new Apps Script `Code.gs` must be deployed as a new Web App version in the user's Apps Script project before the new backend functions become live. The provided Google Sheet URL could not be inspected from this environment, so the package does not assume or alter any existing sheet rows or production data.


### WhatsApp verification delivery
The existing verification flow is preserved. With the current Script Properties, no new OTP property is required: if an OTP template happens to already exist it is used; otherwise BrightAce uses the existing WhatsApp text verification path. No Meta or Apps Script property change is required by this package.


### Work Assignments compatibility
The Work Assignments page reads the existing `adminListConversations` API and filters active verified work client-side. This keeps the page compatible with an already-deployed Apps Script version while `adminListWorkAssignments` remains available in the source backend.


## BrightAce Platform Upgrade — Student, Tutor, Scheduling, Payments & QA

This package preserves the existing BrightAce frontend, verification flow, admin workspace, payment workflow, WhatsApp integration, legal pages and responsive design, while adding:
- Verified Student/Client Dashboard inside Live Chat.
- Standalone Tutor Dashboard with WhatsApp OTP login, assigned work, document download, status updates, submissions and admin communication.
- Tutor recurring availability and Admin scheduling with availability/conflict checks, Zoom link, calendar (.ics) and dashboard-linked appointments.
- Client invoice/receipt view and payment/transaction visibility; Admin payment records now link to the invoice/receipt document.
- Quality-control queue with Admin QA approval/revision and completion gating.
- Scheduled reminder backend function `sendBrightAceScheduledReminders`.

### One-time Apps Script authorization for automatic reminders
After deploying the updated `Code.gs`, open the Apps Script editor and run `installBrightAceReminderTrigger` once. Google will ask the project owner to authorize the time-driven reminder trigger. No new Script Property is required. The trigger checks confirmed sessions every 15 minutes and sends 24-hour/1-hour WhatsApp reminders using the existing BrightAce WhatsApp configuration.

### Important deployment rule
The GitHub Pages files and Apps Script deployment are separate. After replacing `Code.gs`, save it and update the existing `/exec` web-app deployment to the latest saved version. Verify `/exec?action=health` returns JSON before testing the new dashboards.


## Verification test number

For controlled testing, the optional Script Properties below are supported for both Client and Tutor WhatsApp verification:

- `BRIGHTACE_VERIFICATION_TEST_WHATSAPP` = `254725010628`
- `BRIGHTACE_VERIFICATION_TEST_CODE` = `121212`

The test code is used **only** when the entered/registered number matches the configured test WhatsApp number. For that designated number, BrightAce bypasses WhatsApp delivery and accepts the configured six-digit test code. Normal clients and tutors continue to use the generated WhatsApp OTP flow.

**Phone format:** use `254725010628` as the stored value. A leading `+` is optional because BrightAce normalizes phone numbers, but the recommended Script Property value is without `+`.

Do not use a fixed test code for real client/tutor accounts.


## Current pre-publication platform corrections
- Client Dashboard is a separate verified page (`pages/client-dashboard.html`) opened from the Live Chat toolbar; its Back to Live Chat button returns to the existing chat.
- Tutor Dashboard supports project-specific assigned payouts, paid/pending payment visibility, cumulative remaining tutor balance, profile-picture upload, drafts/final submissions, visible work comments, client/admin documents, recurring availability with optional 24-hour days, and scheduled Zoom links.
- Tutor profile uploads use the `tutorUploadProfile` backend action and are visible to Admin and clients.
- Admin → Tutors includes dashboard preview tabs for Tutor Dashboard, Client View, and Interactions. Client View filters out private Admin ↔ Tutor messages.
- Admin navigation is standardized across admin pages. Tutor Portal remains a standalone portal; no tutor workspace is embedded in the main Admin Dashboard.
- Verification test mode is entirely server-side for the designated test number and does not call Meta:
  - `BRIGHTACE_VERIFICATION_TEST_WHATSAPP` = `254725010628`
  - `BRIGHTACE_VERIFICATION_TEST_CODE` = `121212`
  Remove the test-code property before production launch.
- Normal WhatsApp verification continues to use the configured Meta template for non-test numbers.
- Active polling was moved to 30 seconds to reduce Apps Script/Sheets load. This is an optimization, not a guarantee of a specific concurrency level; production capacity still depends on Apps Script, Sheets, Drive, Meta and payment-service quotas and actual load testing.


## FINAL PRE-LAUNCH DEPLOYMENT CHECK

The frontend expects the Google Apps Script Web App `/exec` to return JSON. If the browser says
`BrightAce Apps Script returned HTML instead of JSON`, the saved Code.gs is newer than the deployed
Web App version (or the Web App URL is not the BrightAce deployment).

Update the existing Web App deployment:
1. Apps Script -> save `backend/Code.gs`.
2. Deploy -> Manage deployments.
3. Edit the existing Web app deployment.
4. Select **New version** / latest saved version.
5. Execute as the owner.
6. Keep the required access setting.
7. Deploy.
8. Test the same `/exec?action=health` URL. It must return JSON and include:
   `"ok":true` and `"build":"2026-09-13-PRELAUNCH-1"`.

Do not publish the GitHub Pages frontend until this health check returns JSON.


Tutor test access: BRIGHTACE_TUTOR_TEST_WHATSAPP=0725010628 (normalized to 254725010628) and BRIGHTACE_TUTOR_TEST_CODE=121212.
Client test access: BRIGHTACE_VERIFICATION_TEST_WHATSAPP=254725010628.
Tutor earnings are 50% of the agreed paid client amount. Minimum tutor withdrawal is KSh 2,000. Client web sessions expire after 30 minutes of inactivity and require fresh WhatsApp verification.
