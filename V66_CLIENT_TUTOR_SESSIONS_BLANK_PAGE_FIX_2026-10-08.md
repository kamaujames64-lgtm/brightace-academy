# BrightAce V66 — Client Tutor & Sessions Blank-Page Fix — 2026-10-08

## Base
This patch starts from `BrightAce-V66-CLIENT-DASHBOARD-TUTOR-MULTIJOB-FIX-20261008.zip`.

## Root cause addressed
The tutor page treated `assignedTutor` as a hard prerequisite for rendering the entire workspace. If a client had a mix of assigned and unassigned requests, malformed/legacy assignment data, or a request selected by URL that was no longer in the assigned-only subset, the page could appear empty or fail to present the client's tutoring workspace.

The page is now fail-safe:
- all non-cancelled/non-rejected client jobs are retained as independent Work IDs;
- jobs with a real tutor show the tutor profile and tutor status;
- jobs without a tutor show `ASSIGNMENT PENDING` instead of disappearing;
- sessions are matched by Work ID/conversation ID even when tutor metadata is incomplete;
- a selected Work ID remains visible even if its tutor assignment is pending;
- a rendering exception during a background refresh is now displayed through the standard workspace error UI instead of being silently swallowed.

## Multi-job behavior
A client may have many independent jobs. Each job remains linked to its own:
- Work ID / conversation ID
- tutor
- sessions
- messages
- assignment status

The tutor page must never collapse these jobs into one tutor record.

## Changed file
- `js/client-portal-pages.js`

## Cache/version
The existing `20261008multijob1` script version is retained because this patch changes the file contents only; the final package should be deployed as a new Apps Script/static site version and the browser should be hard-refreshed once.

## Validation
- JavaScript syntax check: PASS
- ZIP integrity: PASS
