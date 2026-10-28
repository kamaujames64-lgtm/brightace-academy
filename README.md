# BrightAce Academy — Workspace Repair (28 October 2026)

This is the cleaned static website and Google Apps Script backend source for BrightAce Academy. It includes the V105 workspace reliability repairs.

## Main changes in this release

- Public HTML documents and static assets now use network-first service-worker handling, with cached copies used only when the network is unavailable. This prevents stale HTML/CSS/JavaScript from being shown on first visit and corrected only after refresh.
- Public soft-navigation stylesheet synchronization preserves shared CSS and waits for newly required stylesheets before replacing the content.
- Client `My Tutors & Sessions` now uses the same authenticated client shell and same-document router as the other client pages.
- Client portal navigation changes page content without a full document reload; messages retain their incremental live polling and other client workspaces refresh status/data in the background.
- Client session bootstrap distinguishes definitive authentication failures from temporary network errors. Temporary failures no longer clear the session and redirect the user unexpectedly.
- Returning to a protected page through browser Back/Forward cache triggers a server session revalidation before private content is shown.
- Expired chat sessions return to the returning-client sign-in page instead of the public home page.
- Tutor profile photos and profile details use a new client tutoring cache namespace to prevent older cached responses from hiding photos.
- Tutor work acceptance is idempotent; repeat clicks/retries do not create duplicate acceptance events or rewind the work state. Tutor status transitions and submissions are restricted to valid workflow stages, and updates invalidate client, tutor, admin and QA caches.
- Booking a tutoring session and viewing session details remain available in the unified client shell.

## Deployment

1. Keep a backup of the currently deployed site and backend.
2. Publish the static website files to the existing website host.
3. Deploy the complete `backend/` folder as a new version of the **same** Apps Script Web App, preserving its `/exec` URL and existing script properties.
4. Test using dedicated staging client, tutor and admin accounts before promoting the release to production.
5. Verify the browser has activated the updated service worker. A single initial reload may be needed once to activate a new service-worker version; normal navigation afterward should use the new network-first rules.

## Validation boundaries

Local JavaScript syntax and source-level regression tests were run. API load and cross-account privacy tests intentionally require a dedicated staging `/exec` URL and were not run because no staging URL was supplied. This package was not deployed to the live website, and real browser/device performance, live Apps Script behavior, payment integrations, and role-to-role end-to-end workflows still require staging verification.

See `BRIGHTACE_WORKSPACE_REPAIR_REPORT_2026-10-28.md` for the detailed change list and test results.
