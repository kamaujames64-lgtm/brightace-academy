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
`https://script.google.com/macros/s/AKfycbx6--Az56QTjbYLQaFB80qLPnD7AUDm0qoVPMX_mmlK_ttV7n5DTIyDHCEvrH9ZGodH/exec`

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
