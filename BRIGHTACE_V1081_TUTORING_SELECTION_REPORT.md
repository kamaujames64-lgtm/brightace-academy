# BrightAce Academy V108.1 — Tutoring request selection repair

## User request understood
In Client Dashboard → My Tutors & Sessions → My Tutoring Jobs, clients need to move between multiple tutoring requests and inspect the selected request's matching tutor information, rating/profile details, sessions and related feedback without getting stuck on one request.

## Implemented
- Added a `Currently viewing` selector when there is more than one active tutoring job.
- Added a `SELECT REQUEST` / `SELECTED · VIEWING` control to every job card.
- Selection updates the `request` query parameter using the History API and redraws the tutoring view in place; no full document reload is required.
- Existing selected-job rendering remains the source of truth for tutor identity, BrightAce tutor rating/profile details, next/latest session, session history and client feedback form.
- Selection controls include accessible labels and pressed/current state.
- Added touch-friendly responsive styling for mobile and tablet widths.
- Existing MESSAGE, JOIN, VIEW DETAILS and feedback submission actions remain in place.
- No backend, database schema, payment, OTP, tutor assignment or admin workflow was changed.

## Files changed
1. `js/client-portal-pages.js` — request selector, card selection controls and in-place selection handler.
2. `css/client-portal.css` — selector, selected state and responsive/touch styles.
3. `pages/client-tutoring.html` — cache-busting versions for the updated CSS and JavaScript.
4. `tools/brightace-v105-workspace-regression-test.js` — updated expected script cache version.
5. `README.md` — V108.1 change note.

## New file
- `tools/brightace-v1081-tutoring-job-selection-test.js`

## Tests
- New tutoring selection checks: 7/7 passed.
- V107 client history/performance regression: 15/15 passed.
- V105 workspace regression: 17/17 passed.
- V106 session/workflow regression: 17/17 passed.
- V108 repair regression: 13/13 passed.
- JavaScript syntax check for `js/client-portal-pages.js`: passed.

These are source-level/regression checks. No live account session or real-device browser test was performed in this environment.

## Preservation notes
The change is limited to client-side selection and styling in the tutoring page. It does not alter server endpoints, stored job records, tutor assignment, messaging, session booking/joining, payment, OTP, or client feedback submission APIs. Selection itself is read-only.
