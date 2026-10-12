# BrightAce V66 — Tutor/Sessions Performance + Booking V2 — 2026-10-09

## Purpose
Repair the 2026-10-09 Tutor/Sessions performance regression while preserving the integrated client → admin → tutor booking workflow.

## Performance repairs
- Reworked `clientPortalData_` to use phone-indexed conversation/payment reads, narrow message-column filtering, fast schedule lookup, and 60-second server caching instead of broad full-sheet reads on every client workspace request.
- Reworked tutor profile lookup to use indexed row reads rather than loading the entire TUTORS sheet.
- Reworked client/tutor session-booking lookup to use phone indexes and short cache TTLs.
- Tutor/Sessions client page now calls only `clientTutorSessions` and does not cascade through the heavy dashboard endpoints when the direct endpoint is slow.
- Tutor/Sessions API timeout is 8 seconds with no second 30-second retry; the page can immediately use its local snapshot.
- Admin dashboard uses a lightweight pending-booking count instead of loading every booking row on every dashboard refresh.
- Pending booking count is cached briefly and invalidated when a booking is created/confirmed/declined.

## Booking workflow
1. Client chooses a specific Work ID and presses **BOOK A SESSION** under Latest/Next Session.
2. Request is written to `SESSION_BOOKINGS` as `PENDING_ADMIN_REVIEW`.
3. Admin Scheduling displays the request and can check tutor availability.
4. Admin confirms availability and supplies the Zoom link.
5. Backend re-checks tutor availability and schedule conflicts before confirmation.
6. Confirmed appointment is written to authoritative `SCHEDULES`.
7. Client sees the confirmed appointment and Zoom link.
8. Tutor sees the booking status and confirmed Zoom appointment in the tutor dashboard.
9. Client and tutor receive the confirmation message.

## Multi-job behavior
Every booking is tied to one `conversationId` / Work ID. Different jobs can have different tutors, dates, sessions, and booking states.

## Deployment verification
Health must report build:
`2026-10-09-V66-CLIENT-TUTOR-BOOKING-PERF-V2`

Deploy this version to the same Apps Script project and existing `/exec` Web App deployment.
