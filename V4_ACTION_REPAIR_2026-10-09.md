# BrightAce V66 — Action Registry / Routing Repair — 2026-10-09

## Root cause
The V3 frontend and backend had an action-contract regression: `adminChangeOwnPassword` was still called by Admin Team but its backend route/security registration had been dropped from the V66 package. `adminCountSessionBookings` also had a backend function and security permission but no `doPost` dispatcher route.

This created two different failure modes: security could reject an action as `Unknown BrightAce action`, or the request could pass security and then fall through to `Unknown POST action`.

## Repairs
- Restored `adminChangeOwnPassword` in `backend/Code.gs`.
- Registered `adminChangeOwnPassword` in `backend/BA_Security.gs`.
- Added the `adminChangeOwnPassword` POST dispatcher route.
- Added the missing `adminCountSessionBookings` POST dispatcher route.
- Bumped build to `2026-10-09-V66-CLIENT-TUTOR-BOOKING-PERF-V4-ACTION-REPAIR`.
- Revalidated frontend POST actions against the backend security registry.
