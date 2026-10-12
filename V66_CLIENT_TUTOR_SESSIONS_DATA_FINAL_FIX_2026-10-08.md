# BrightAce V66 — Client Tutor & Sessions Data FINAL Fix — 2026-10-08

This revision addresses the repeated blank/unchanged Tutor & Sessions page.

## Changes

1. `pages/client-tutoring.html` is now a self-contained client page. It renders the complete workspace shell immediately and does not depend on the shared portal boot completing before the page becomes visible.
2. The page calls `clientTutorSessions` first, then `clientPortalData`, then `clientDashboard` as compatibility fallbacks.
3. The page accepts both current `requests` and legacy `requestHistory/workHistory` response shapes.
4. API failures are rendered as a visible retry panel instead of leaving a blank page.
5. `backend/Code.gs` `clientTutorSessions_` now uses the authoritative CONVERSATIONS, SCHEDULES and TUTORS sheets directly. This intentionally avoids TextFinder/index dependency for this page because the current workbook is small and reliability is more important here.
6. Tutor matching works by both stored tutor phone and tutor name, including historical rows where `assignedTutorPhone` is empty.
7. Each Work ID remains independent, so different jobs can have different tutors and sessions.
8. Service-worker version was bumped to force the new page to be fetched.

## Expected result

The page cannot silently remain blank. It immediately shows the My Tutors and Sessions workspace, then populates every non-cancelled/non-rejected job, assigned tutor/pending assignment state, upcoming/latest session, Zoom link when valid, and job-specific session history.
