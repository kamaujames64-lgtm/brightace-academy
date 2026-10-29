# BrightAce Academy — Workspace Repair V106 Report

Date: 28 October 2026  
Release: V106 — Idle Session Security and QA Workflow  
Service-worker cache namespace: `brightace-perf-20261028-v106-idle-session-workflow`  
Backend build/API markers: `2026-10-28-V106-IDLE-SESSION-QA-WORKFLOW` / `brightace-json-v106`

## What changed

### 1. Tutor and admin inactivity logout
- Added a shared privileged-workspace idle controller in `js/app.js` with a 30-minute timeout based on actual user interactions (pointer, keyboard, input/change, touch and scroll).
- Background polling does not count as activity. Active sessions send a small authenticated session-touch request at most once per minute of interaction.
- Added server-side idle enforcement to `getAdminProfile_` and `requireTutor_`; API polling can no longer keep a privileged session alive. Only `adminTouchSession` and `tutorTouchSession` refresh the inactivity timestamp.
- The idle timer clears browser credentials and redirects tutors to the tutor verification screen and admins to the admin sign-in page, with a clear timeout message. The redirect path handles both `/pages/` and root-level admin workspaces.
- Added the new touch actions to `backend/BA_Security.gs` allowlisting. Active sessions retain the existing rolling maximum token lifetime; inactivity remains a separate 30-minute limit.
- Removed the previous owner-token fallback that reconstructed an admin session from the token prefix when the authoritative server record was missing.

### 2. Client inactivity remains 30 minutes
- Preserved the client 30-minute inactivity policy and WhatsApp reverification path.
- Fixed `requireClientSession_` so authenticated reads and message polling validate the session without extending the inactivity clock. Only the explicit `clientTouchSession` action records user activity.
- Cache-miss recovery now preserves the last activity recorded in the client record rather than treating the cache miss as a new interaction.
- Passive dashboard bootstrap no longer renews client activity. Client portal/chat code now checks the saved user-activity timestamp before attempting bootstrap, and background chat polling no longer overwrites it.

### 3. QA and request stage flow
- QA review is accepted only when tutor work is in `READY_FOR_QA`; closed, cancelled, rejected or completed work cannot be reviewed again.
- Repeated QA approval is idempotent and does not create duplicate review messages.
- QA approval is described as approval awaiting completion confirmation; it is no longer incorrectly announced as already completed.
- Final completion now requires both confirmed payment and QA approval. Completion updates `assignmentStatus` and `tutorWorkStatus`, adds a shared client/admin timeline event, notifies the client through the configured WhatsApp channel, sends a tutor-specific message, invalidates relevant caches and records an admin audit event.
- The QA screen shows distinct waiting states for tutor submission, tutor revision and QA approval; the completion action is disabled until QA approval.
- Reassigning work resets stale tutor submission/QA state when the tutor changes or the prior stage cannot be preserved. Closed work must first be restored through the admin restore workflow, which resets tutor and QA stages before reassignment.

### 4. Sound and cache/security consistency
- Kept the existing `BrightAceSound` engine, click/keyboard audio unlock, deadline notifications and client new-message sound logic intact.
- Bumped shared `app.js`, `chat.js`, and client portal script query versions.
- Bumped the service-worker namespace and made `app.js` network-only because it now contains session security logic. Root-level `admin.html` and `tutor.html` are also explicitly treated as private documents, alongside the existing private portal routes.
- Updated the backend health/version and deployment metadata to V106, updated source-contract tests to the new release markers, and retained the existing API `/exec` configuration.

## Validation results

Passed locally:
- V106 session/workflow contract: **17/17**.
- V105 workspace navigation/cache regression: **17/17**.
- All **14** local regression/security/resource/workflow test scripts in the suite passed after updating historical tests to recognize the current V106 build marker.
- Production-readiness source audit: **30/30**, including the new privileged/client idle-policy checks.
- Historical V52 performance audit: **19/19**.
- Python service tests: **10/10** (`python -m pytest python-service/tests -q`).
- JavaScript and Apps Script syntax checks: **68 files checked, 0 failures**.
- Inline executable scripts: **74 blocks checked, 0 syntax failures**.
- HTML literal local references: **53 HTML documents checked, 0 missing references**.
- Local static-bundle synthetic load: **800 requests / 100 virtual users, 0 failed requests**, about 1,404 requests/second for the local static bundle. Observed p95 latency was about 329 ms; this is not a production backend capacity claim.

Not verified against live services:
- The authenticated API load test and two-client privacy isolation test require a dedicated staging Apps Script `/exec` URL and dedicated test accounts. They were not run against production; no staging requests were sent.
- This ZIP was not deployed to the live site and no real client/tutor/admin account actions were performed. Browser audio playback, live WhatsApp delivery, Google Apps Script behavior, real device performance and cross-role end-to-end flows still need staging verification. The existing sound engine/unlock path was source-checked, not physically verified through a real browser speaker test.

## Deployment instructions

1. Back up the current site and Apps Script project.
2. Publish the static website files to the existing host.
3. Deploy the complete `backend/` folder as a new version of the **same** Apps Script Web App. Preserve the existing `/exec` URL and Script Properties.
4. Verify the V106 health marker and run the idle-timeout and QA workflow checks with dedicated staging client, tutor and admin accounts before production use.
5. Confirm that the browser activates the V106 service worker. A one-time reload may be needed to activate the new cache namespace.

The frontend and backend must be deployed together: the new server-enforced idle timeout depends on the V106 backend actions and session checks.
