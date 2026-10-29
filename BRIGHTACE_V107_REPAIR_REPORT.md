# BrightAce Academy V107 repair report

**Date:** 29 October 2026  
**Base:** V106 repaired ZIP  
**Release scope:** Client API performance, live-refresh reliability, and client request History.

## User requirements implemented

1. Improve client portal API performance without weakening client session validation or client-to-conversation authorization.
2. Reduce redundant/overlapping message refresh requests while preserving live updates and the existing notification sound implementation.
3. Add a History button in the client dashboard navigation and a dedicated private History page.
4. Keep completed/rejected requests in the ordinary client pages for seven days after their recorded terminal timestamp; after the grace period, show them in History rather than operational request pages.
5. Keep follow-up routes from History to the original work details and its conversation.

## Changes

### Performance and live refresh

- `backend/Code.gs`: `clientPortalData_` now obtains message row numbers through cached exact per-conversation indexes (`BA_FAST_MSG_CONV_ID`) rather than scanning the whole `MESSAGES` conversation-ID column on each client data cache miss. The conversation IDs are still derived from the authenticated client's phone-indexed conversation records; session validation remains in place.
- `backend/Code.gs`: `saveMessage_` invalidates the relevant conversation's message-row index after a new message is written, so a new message is not hidden by the row-index cache.
- `backend/BA_Speed.gs`: `baInvalidateClientSpeedCaches_` now clears client summary and tutor-session cache versions as well as the dashboard/schedule caches when a work update invalidates the client view. This is intended to preserve prompt status changes while caching unchanged data.
- `js/client-portal-pages.js`: identical in-flight `clientWorkMessages` calls are deduplicated, the client tab-local tutor-session snapshot is reused briefly before revalidation, and page-specific polling timers are cleared on same-document navigation. The dashboard-summary cache key is versioned to avoid reusing pre-V107 summary shapes.
- `sw.js` and client page script query strings: versioned for V107 so browsers can fetch the updated client portal script and service-worker namespace.

### Client History and seven-day grace period

- New `pages/client-history.html` uses the existing verified client portal shell, private/noindex document policy, and shared client router.
- `js/client-portal-pages.js` adds History to the side navigation, dashboard quick actions, and My Requests page. It classifies completed/rejected jobs from the recorded status and completion/rejection timestamp. Jobs stay in ordinary client pages for seven days; older terminal jobs are shown in History. If a terminal timestamp is absent or invalid, the job is not automatically archived.
- The History page shows completed/rejected status, request and status dates, tutor, rejection reason when available, and links to the original work and conversation. Explicit work/message links from History can still open that specific archived job for follow-up without putting all archived jobs back into the ordinary lists.
- `backend/Code.gs` client summary response now includes rejection timestamp/reason fields needed by the dashboard summary view.

## Files changed

- `backend/Code.gs`
- `backend/BA_Speed.gs`
- `js/client-portal-pages.js`
- `sw.js`
- `README.md`
- `pages/client-history.html` (**new**)
- Client HTML pages that load `client-portal-pages.js` (11 pages including the new History page):
  - `pages/client-dashboard.html`
  - `pages/client-history.html`
  - `pages/client-messages.html`
  - `pages/client-new-request.html`
  - `pages/client-payments.html`
  - `pages/client-profile.html`
  - `pages/client-progress.html`
  - `pages/client-requests.html`
  - `pages/client-resources.html`
  - `pages/client-tutoring.html`
  - `pages/client-work.html`
- Existing regression tests updated to expect the V107 cache namespace:
  - `tools/brightace-v102-security-gate-test.js`
  - `tools/brightace-v105-workspace-regression-test.js`
  - `tools/brightace-v92-fetch-recovery-test.js`
  - `tools/brightace-v106-session-workflow-test.js`
  - `tools/brightace-v98-client-navigation-payment-test.js`
  - `tools/brightace-v104-performance-privacy-photo-test.js`
  - `tools/brightace-v100-responsive-tutoring-phone-test.js`
  - `tools/brightace-v88-resource-test.js`
- `tools/brightace-v107-client-history-performance-test.js` (**new**)

## Validation

- JavaScript syntax check passed for `js/client-portal-pages.js`.
- Backend source syntax check passed with Node after copying `Code.gs` to a `.js` temporary file; this is a syntax check only, not a Google Apps Script runtime test.
- V107-specific source regression checks: **15/15 passed**.
- Existing static regression/security/workflow suites were run; all suites that do not require a live staging URL passed.
- Live staging privacy-isolation and API load tests were **not run** because this repair environment was not supplied a dedicated staging `/exec` endpoint. No live production API was called, no live deployment was made, and no real client records were modified.

## Important deployment note

This ZIP changes project source only. It does not deploy the Apps Script backend or publish website files. Deploy the complete backend to a new version of the **same** Apps Script Web App (preserving the existing `/exec` URL and script properties), publish the static files, then validate with dedicated staging client accounts before production rollout. Confirm that the deployment's `CONVERSATIONS` sheet has valid `completedAt` and `rejectedAt` timestamps for historical records; jobs without a trustworthy status timestamp intentionally remain visible in ordinary pages rather than being silently archived.
