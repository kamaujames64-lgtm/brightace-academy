# BrightAce Academy — 24-Hour Stabilization Plan

## Phase 1 — Single backend (first priority)
1. Deploy this package's `backend/Code.gs` to the SAME Apps Script project used by the production `/exec` URL.
2. Update the existing Web App deployment to the newly saved version.
3. Execute as: Me / deploying account.
4. Access: Anyone (anonymous) for a public API endpoint.
5. Open `/exec?action=health` and confirm JSON with build `2026-09-16-STABILIZATION-1`.
6. Do not use `/dev` for production.

## Phase 2 — Smoke tests
- Client test number: +254725010628; test code: 121212.
- Tutor test number: 0725010628 / +254725010628; test code: 121212.
- Client: verify -> chat -> dashboard -> Payments -> Tutoring -> back to chat.
- Tutor: verify -> dashboard -> assigned work -> profile -> wallet -> Admin messages.
- Admin: sign in -> Tutor Directory -> Open Dashboard -> Admin Team -> add admin -> verify it appears.

## Phase 3 — Workflow tests
- New client request appears in Admin work queue.
- Assignment attachment appears in Client/Admin conversation and Tutor Dashboard.
- Tutor sees payout only; never gross client payment.
- Tutor submission appears to Client and Admin.
- QA revision/approval appears to Tutor and Client.
- Client feedback saves per request.
- Zoom link opens.
- Blocked WhatsApp number is rejected.

## Phase 4 — Performance
- Keep live chat polling at 15 seconds.
- Dashboard/admin/tutor polling is 30 seconds and pauses in hidden tabs.
- Cache short-lived read-heavy dashboard data.
- Avoid sheet writes on every read; session activity is persisted only periodically.
- Do not claim 500 simultaneous clients until an actual concurrent load test passes.

## Phase 5 — Deployment gate
Production is considered stabilized only when:
- `/exec?action=health` returns JSON and build `2026-09-16-STABILIZATION-1`.
- Browser Network requests point to the same `/exec` URL.
- No browser console errors occur during the smoke tests.
- Apps Script Executions show successful `doPost`/`doGet` runs.


## 2026-09-16 correction pass — STABILIZATION-2
- Stopped tutor polling from overwriting active form edits.
- Corrected tutor AbortController usage so fetch receives an AbortSignal.
- Client inactivity now returns to the full Live Chat request page with the session-restoration warning.
- Client Payments/Tutoring only redirect on genuine session expiry; transient API failures keep the current page open.
- Client dashboard polling is silent while a request modal/form is active.
- Admin History now uses the POST API path, shows an inline load failure instead of hanging on “Loading…”, and has short-lived server caching.
- Admin authentication token is retained across ordinary page reload/navigation and cleared on logout.
