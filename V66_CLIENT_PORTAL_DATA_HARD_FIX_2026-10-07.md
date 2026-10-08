# BrightAce V66 — Client Portal Data Population Hard Fix — 2026-10-07

## Root causes found
- `client-dashboard.html` was still using a separate legacy inline dashboard implementation instead of the shared V66 client portal data layer.
- Client pages were making multiple server round trips for data that could be returned in one authenticated portal snapshot.
- The previous V66 client-data package changed the shared pages but did not replace the legacy dashboard implementation.
- The backend still had separate dashboard/request/message/schedule lookups that could multiply Google Sheets reads and make a client page appear to load indefinitely when Apps Script was slow.

## Hard fix
- Added authenticated `clientPortalData` endpoint.
- `clientDashboard` now delegates to the same portal snapshot endpoint.
- Portal snapshot reads CLIENTS, CONVERSATIONS, MESSAGES, PAYMENTS and SCHEDULES in bounded single-sheet reads, filters by normalized verified WhatsApp number, and caches the assembled result for 30 seconds.
- Client Requests, Tutor & Sessions, Messages, Work, Progress, Payments and Profile now use the same snapshot.
- Tutor & Sessions no longer makes a second `clientGetRequest` call just to load tutor messages.
- Study Resources no longer makes an unnecessary second call during initial portal boot; it uses resources supplied by the snapshot when present.
- Replaced the legacy dashboard page with the shared client portal shell and dashboard renderer.
- Bumped client portal script and service-worker versions to defeat stale browser/service-worker assets.
- Client session remains 30-minute inactivity based; interaction continues to refresh the inactivity timer.

## Files changed
### Backend
- backend/Code.gs
- backend/BA_Security.gs

### Frontend
- js/client-portal-pages.js
- pages/client-dashboard.html
- pages/client-new-request.html
- pages/client-requests.html
- pages/client-tutoring.html
- pages/client-messages.html
- pages/client-resources.html
- pages/client-work.html
- pages/client-progress.html
- pages/client-payments.html
- pages/client-profile.html
- sw.js

## Deployment gate
Deploy the complete package to the SAME Apps Script project and update the SAME Web App deployment to a new version. Keep the existing `/exec` URL. Do not create a second production Web App.

After deployment, `/exec?action=health` must return JSON and the browser Network tab must show the same production `/exec` URL for `clientPortalData`.
