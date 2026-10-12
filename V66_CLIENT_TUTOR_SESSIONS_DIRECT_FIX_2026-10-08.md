# BrightAce V66 — Client Tutor & Sessions Direct Data Fix — 2026-10-08

## Why this revision exists

The previous 2026-10-08 multi-job package still depended on the full `clientPortalData` dashboard payload before the Tutor & Sessions page could render. That made the page vulnerable to any dashboard-data/API failure and could leave the page appearing empty.

## Fix

A dedicated authenticated `clientTutorSessions` endpoint was added. It reads only:

- verified client's conversation rows
- schedules belonging to the client or those conversation IDs
- tutor profile information for assigned tutors

It uses the existing fast phone/conversation indexes and short cache.

The client frontend now calls `clientTutorSessions` directly for My Tutors & Sessions. It has compatibility fallbacks to `clientPortalData` and `clientDashboard` so the page is not tied to one endpoint.

## Multi-job behavior

All non-cancelled/non-rejected jobs are displayed independently. A job may be:

- assigned to a tutor
- waiting for tutor assignment
- scheduled for one or more sessions
- unscheduled

Each job retains its Work ID / conversation ID context.

## Validation

- `backend/Code.gs` syntax checked after copying to `.js`.
- `js/client-portal-pages.js` syntax checked with Node.
- ZIP integrity checked with `unzip -t`.

## Deployment

Update the SAME Apps Script Web App deployment with the package, creating a new version while keeping the existing `/exec` URL. Hard refresh the client browser after deployment.

The health endpoint should report build:

`2026-10-08-V66-CLIENT-TUTOR-SESSIONS-DIRECT`
