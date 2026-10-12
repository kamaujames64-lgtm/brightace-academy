# BrightAce V66 — Client Dashboard + My Tutors & Sessions + Multi-Job Fix

Date: 2026-10-08

## Purpose

This package updates the existing client portal so Dashboard, My Tutors & Sessions, Messages, My Requests, Assignments & Work, and Progress present real Google Sheets data in a stable multi-job model.

## Visual target

The Dashboard is aligned to the supplied BrightAce reference: welcome hero, four summary cards, recent activity, quick actions, help/WhatsApp area, and a real-work list.

My Tutors & Sessions is aligned to the supplied reference: tutor profile, active job context, next/latest session, Zoom action, tutoring-job cards, and session history.

## Multi-job behavior

A client may have many independent requests/jobs. Every Work ID / conversation is treated as its own context.

- Messages has a job selector and never mixes tutor messages from unrelated jobs.
- My Tutors & Sessions shows each assigned job separately and lets the client open one job at a time.
- Sessions are filtered by Work ID / conversationId.
- Assignments & Work and My Requests link directly to the relevant Work ID.
- Dashboard shows multiple real jobs instead of assuming one current request.
- Tutor profile information can now be resolved by tutor phone or tutor name, improving display when an assigned tutor record lacks a phone on the request row.
- Invalid local/file Zoom links are not presented as clickable Join buttons.

## Session activity

The browser now also treats pointer/touch/scroll interaction as activity (throttled for scroll), in addition to click/keyboard/input activity. The 30-minute timeout remains inactivity-based.

## Performance

- `clientPortalData` remains the single authenticated client snapshot endpoint.
- Frontend POST de-duplication now includes `clientPortalData`.
- Dashboard cache prefix was bumped to prevent stale visual/data structures from being reused.
- Service-worker and client script cache versions were bumped.

## Changed files

Backend:
- `backend/Code.gs`
- `backend/BA_Speed.gs`

Frontend:
- `js/client-portal-pages.js`
- `css/client-portal.css`
- `sw.js`
- `pages/client-dashboard.html`
- `pages/client-new-request.html`
- `pages/client-requests.html`
- `pages/client-tutoring.html`
- `pages/client-messages.html`
- `pages/client-resources.html`
- `pages/client-work.html`
- `pages/client-progress.html`
- `pages/client-payments.html`
- `pages/client-profile.html`

## Deployment

Update the SAME Apps Script project and the SAME Web App deployment. Deploy as a new version but keep the existing `/exec` URL. Do not create a second production Web App.

After deployment, `/exec?action=health` should still return JSON. The health build should move forward from the old `2026-10-06-V66-SPREADSHEET-ALIGNED` deployment once the new backend is actually deployed.
