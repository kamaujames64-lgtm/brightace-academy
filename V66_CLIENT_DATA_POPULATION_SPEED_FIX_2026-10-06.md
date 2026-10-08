# BrightAce V66 — Client Data Population + Speed Fix — 2026-10-06

## Fixed
- Client session timeout is now strictly 30 minutes of inactivity in the shared client portal shell. The browser no longer uses the server's last absolute expiry timestamp as a hard logout deadline for an active user.
- Client dashboard/message data now returns the recent client message history across the verified client's request IDs, while retaining `currentRequestMessages` for request-specific consumers.
- Client message attachments and tutor submissions now carry `conversationId/sessionId`, allowing the Assignments & Work page to populate the correct documents and tutor submissions without one API request per work card.
- `clientAllMessages_` now scans the recent MESSAGES tail once instead of reading the sheet once per conversation. This removes a major source of delay for clients with many historical requests.
- Assignments & Work no longer fires `clientGetRequest` for every request card during initial page load. It renders from the dashboard payload and only uses server calls for explicit send/upload actions.
- Dashboard page keeps its last saved HTML view visible while refreshing and uses a shorter 15-second request timeout instead of leaving the user on a long spinner.
- Client portal page script cache-busting was updated to force browsers to load the repaired V66 client data layer.

## Spreadsheet alignment confirmed
The aligned workbook contains a populated CLIENTS record for the verified client and multiple matching CONVERSATIONS and PAYMENTS records, plus a scheduled session record. The client pages now consume those backend records by the canonical normalized WhatsApp number and conversation IDs.

## Intentional empty state
RESOURCE_PURCHASES/RESOURCES contain no populated resource records in the aligned workbook, so Study Resources can legitimately remain empty until a resource is published/granted. The UI should show an accurate empty state rather than fabricate resources.

## Files changed
### Backend (.gs)
- `backend/Code.gs`

### Client frontend (.js/.html)
- `js/client-portal-pages.js`
- `pages/client-dashboard.html`
- `pages/client-requests.html`
- `pages/client-tutoring.html`
- `pages/client-messages.html`
- `pages/client-resources.html`
- `pages/client-work.html`
- `pages/client-progress.html`
- `pages/client-payments.html`
- `pages/client-profile.html`

## Deployment
Deploy this package as a **new version of the SAME existing Google Apps Script Web App deployment**. Keep the existing `/exec` URL. Do not create a second production Web App.
