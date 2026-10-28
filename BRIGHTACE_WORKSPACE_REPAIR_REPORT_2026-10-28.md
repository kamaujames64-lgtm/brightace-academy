# BrightAce Academy Workspace Repair Report

Date: 28 October 2026  
Release/cache namespace: `brightace-perf-20261028-v105-network-first-workspace-fix`

## Changes made

### First-load styling and public navigation
- Replaced stale-while-revalidate handling of HTML documents and static assets in `sw.js` with network-first behavior and cache fallback only when the network fails. Private documents and authentication-critical scripts remain network-only.
- Updated the service-worker namespace so browsers do not keep using the older cache namespace.
- Updated `js/brightace-speed-engine.js` so public soft-navigation stylesheets are added and allowed to load before obsolete stylesheets are removed. Public pages containing executable scripts now fall back to normal browser navigation instead of swapping markup without running page scripts.

### Client navigation and session safety
- Replaced the separate tutoring page implementation with a lightweight page entry that boots the shared `js/client-portal-pages.js` workspace shell.
- Registered `client-tutoring.html` in the shared client router. Dashboard, requests, messages, tutoring, work, progress, resources, payments, profile and new-request routes now share one navigation layer and transition without a full document reload.
- Kept tutoring session booking, individual session details, ratings, tutor profile pictures and feedback in the shared renderer.
- Added a short-lived, tab-scoped tutor-session snapshot keyed by client phone, and changed the backend endpoint cache key to V3 so older cached responses do not hide tutor profile photos.
- Changed client session bootstrap handling so a temporary network failure does not automatically clear a valid local session and redirect the user.
- Added a `pageshow` guard for browser Back/Forward cache restores. The document is hidden while the stored session is revalidated; private content is not intentionally shown before that check.
- Changed expired chat-session navigation to return to `chat.html?mode=returning` instead of the public homepage.
- Added background refresh for client workspace data while the tab is visible and the user is not editing a form. The messages page keeps its existing faster incremental polling behavior.
- Bumped shared client stylesheet and portal script query versions to the V105 workspace release.

### Tutor acceptance, status transitions and Admin QA
- Made `tutorAcceptWork_` idempotent. Repeated acceptance requests for accepted/in-progress/submitted/revision/QA-approved/completed work return the current state instead of writing another acceptance message.
- Prevented tutors from accepting declined, cancelled, rejected or closed work, or moving later-stage work back to `ACCEPTED`.
- Restricted tutor status updates to valid workflow transitions. Repeated updates to the current status are idempotent; invalid backwards transitions are rejected by the backend.
- Blocked tutor submissions after QA approval or when work is closed/cancelled/rejected/declined, and required work to be accepted before submission.
- Made acceptance/decline events use the shared `work-status` timeline source and update the conversation timestamp/message pointer correctly.
- Expanded cache invalidation to include the client tutor-session endpoint, client dashboard/messages, tutor dashboard, Admin work queues and Admin QA views. This helps status changes reflect across roles without a manual refresh.
- Updated tutor UI acceptance controls to remain disabled after QA approval and completion.

### Repository cleanup
- Removed historical root-level release/audit markdown files and duplicate old root text reports. Retained the main README, this release report, application source, backend source, assets, Python service files, and test/deployment tooling.
- Added `tools/brightace-v105-workspace-regression-test.js` to check the release-specific navigation, caching, session and workflow contracts.
- Updated older source checks to test the unified client shell and current V105 cache namespace instead of the removed duplicate tutoring-page implementation or old cache version.

## Validation

Passed:
- JavaScript syntax checks for source and test scripts.
- Apps Script backend syntax check after copying `backend/Code.gs` to a temporary `.js` file for Node's parser.
- `brightace-load-test.js` source/load checks.
- `brightace-regression-test.js`.
- `brightace-security-test.js`.
- `brightace-tutor-status-visibility-test.js`.
- `brightace-v100-responsive-tutoring-phone-test.js` (11/11).
- `brightace-v102-security-gate-test.js`.
- `brightace-v104-performance-privacy-photo-test.js` (11/11).
- `brightace-v105-workspace-regression-test.js` (17/17).
- Python service tests: `python -m pytest python-service/tests -q` (10/10).
- `brightace-v86-resource-test.js`, `brightace-v88-resource-test.js` (51/51), `brightace-v89-admissions-gate-test.js`, `brightace-v92-fetch-recovery-test.js`, `brightace-v94-client-access-tutor-test.js`, and `brightace-v98-client-navigation-payment-test.js`.

Not run:
- API load and cross-account privacy tests require `BRIGHTACE_STAGING_API_URL` pointing at a dedicated staging Apps Script deployment. Both stopped safely before making any requests because no staging URL was supplied.
- No live production deployment or real account actions were performed. Browser-based first paint, network latency, cross-role workflows, real-time messaging and mobile-device behavior still need staging verification.

## Important deployment note

The static website and Apps Script backend must be deployed together. The backend changes will not take effect merely by uploading the static site. Deploy the complete `backend/` folder as a new version of the existing Apps Script Web App, preserve the current `/exec` URL and script properties, and verify using dedicated staging client/tutor/admin accounts before production rollout.
