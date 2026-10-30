# BrightAce Academy — Workspace Repair (29 October 2026)

This is the cleaned static website and Google Apps Script backend source for BrightAce Academy. It includes the V106 session-security and QA workflow repairs plus V107 client API performance and request-history changes.

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

- Tutor and admin workspaces automatically sign out after 30 minutes without real user interaction; browser tokens are cleared and the backend enforces the same idle cutoff. Tutors must verify their registered WhatsApp number again; admins must sign in again. Background API polling does not count as activity.
- Client inactivity remains 30 minutes and requires fresh WhatsApp verification. Client message polling and passive dashboard bootstrap no longer reset the real-user activity clock.
- Admin QA can review only tutor work marked Ready for QA. Repeated review actions are idempotent, closed work cannot be casually reassigned, and final completion requires QA approval plus confirmed payment.
- QA approval/revision and completion messages are sent to the relevant client/tutor channels; restoring work resets stale tutor and QA state before reassignment.
- The existing BrightAce notification-sound engine and browser audio-unlock behavior are retained. The service worker now treats `app.js` and root-level admin/tutor dashboard documents as network-only security-critical resources.

- V107 reduces `clientPortalData` cache-miss work by using exact per-conversation message-row indexes cached by the existing fast-index helper instead of rereading the entire message conversation-ID column for every client cache miss. New messages invalidate their conversation index.
- V107 deduplicates identical in-flight `clientWorkMessages` reads, clears page-specific polling intervals during same-document navigation, and avoids immediately repeating a `clientTutorSessions` request when a fresh tab-local snapshot is already available. Status updates invalidate the client summary and tutor-session caches so live changes are not stranded behind stale cache entries.
- V107 adds a private client History page and menu entry. Completed/rejected requests remain in operational client pages for seven days after their recorded terminal status timestamp, then appear in History. Missing terminal timestamps are not automatically archived. History includes links to work details and follow-up messages.

## Deployment

1. Keep a backup of the currently deployed site and backend.
2. Publish the static website files to the existing website host.
3. Deploy the complete `backend/` folder as a new version of the **same** Apps Script Web App, preserving its `/exec` URL and existing script properties.
4. Test using dedicated staging client, tutor and admin accounts before promoting the release to production.
5. Verify the browser has activated the updated service worker. A single initial reload may be needed once to activate a new service-worker version; normal navigation afterward should use the new network-first rules.

## Validation boundaries

Local JavaScript syntax and source-level regression tests were run. API load and cross-account privacy tests intentionally require a dedicated staging `/exec` URL and were not run because no staging URL was supplied. This package was not deployed to the live website, and real browser/device performance, live Apps Script behavior, payment integrations, and role-to-role end-to-end workflows still require staging verification.

See `BRIGHTACE_WORKSPACE_REPAIR_REPORT_2026-10-28-V106.md` for the detailed change list and test results.
\n\n## V108 repair update (30 October 2026)\n\nSee `BRIGHTACE_V108_REPAIR_REPORT.md` for the international phone-picker, OTP round-trip, public Resources performance and responsive updates, changed-file list, validation limits and deployment precautions.\n