# BrightAce Academy v104 — Performance, session privacy, navigation, and tutor-photo repair

## Source and scope
This package was prepared from the supplied `BrightAce_Academy_Audited_v103.zip`. It is a source-level patch and has **not** been deployed to GitHub Pages or Google Apps Script.

## What changed

### Performance and navigation
- Added `js/brightace-speed-engine.js` and `css/brightace-speed-engine.css` to the public homepage and selected informational pages.
- Enabled opt-in soft navigation for the public informational pages. The engine prefetches eligible same-origin HTML links and lazy-loads below-the-fold images; soft navigation is limited to pages that pass safety checks.
- Updated soft navigation to synchronize page-specific stylesheets, inline head styles, page title, description, canonical URL, and active navigation state.
- Added a same-document router for the shared client portal pages: Dashboard, New Request, Requests, Messages, Work, Progress, Profile, Resources, and Payments. Those routes keep the authenticated shell mounted, use History API navigation, paint a skeleton immediately, and reuse session-scoped data caches. Existing server API actions still validate the client session.
- Routes with separate transaction/verification flows (chat/OTP, standalone tutor sessions and booking, payment invoice/receipt, statement PDF) intentionally retain document navigation. They need separate route-specific QA before being folded into the shared router.
- Bumped the service-worker cache namespace to v104 and configured service-worker registration with `updateViaCache: 'none'` to reduce stale-script rollout issues.

### Session privacy and screenshot issue
- Chat and client portal session credentials now restore from tab-scoped `sessionStorage`, not persistent `localStorage`.
- Old persistent session entries and the persistent tutor-session snapshot are removed as legacy data; they are not migrated into a new trusted session.
- Chat's saved verified session is validated by `clientDashboardBootstrap` before private chat controls/messages are revealed. Pending new-client OTP state checks the public intake/block status before showing the OTP form.
- When a verified chat opens, the returning-client and OTP panels are hidden so the screenshot's returning-user form and private conversation cannot remain visible together.
- The standalone client tutoring page now calls `clientDashboardBootstrap` and confirms the server-issued session before it renders any cached private tutoring records. Its snapshot is tab-scoped only.
- Client portal route changes keep the session in memory only after the initial server bootstrap; each protected API action continues to use the server-issued token and must be authorized server-side.

### Tutor photos
- Client tutor cards accept several photo field aliases (`tutorProfilePictureUrl`, `tutorPhotoUrl`, `tutorPhoto`, `tutorProfilePhotoUrl`, `profilePictureUrl`, `tutorAvatarUrl`).
- Google Drive file URLs are normalized to thumbnail URLs and a second Drive URL form is attempted if the thumbnail fails. Broken/unavailable images fall back to tutor initials/person icon.
- Updated `backend/BA_Speed.gs` tutor-profile lookup to index canonical and display-name aliases, which helps when the assigned job stores a tutor display name rather than the tutor sheet's canonical name. Cache key version was bumped to avoid stale profile-map results.
- Drive images still need sharing/permissions that allow the intended client to view them. Frontend changes cannot override private Drive permissions.

## Validation performed
- JavaScript syntax checks passed for the changed core scripts.
- Python helper syntax checks and ZIP integrity checks are included in the release QA.
- New v104 source regression checks: 11/11 passed.
- Static privacy checks: 8/8 passed.
- Existing responsive tutoring/phone tests: 11/11 passed.
- Existing client navigation/payment/admission regression tests: 17/17 passed.
- Existing client access/tutor suite (including nested resource tests): 51/51 passed.
- These are source-level checks, not proof of runtime isolation or a live speed score. A staging browser test and two-account privacy isolation test are still required.

## Required deployment steps
1. Extract the ZIP and publish the contents of `brightace-academy-main/` to the existing GitHub Pages repository while preserving the project path.
2. Deploy the changed `backend/BA_Speed.gs` file to the existing Google Apps Script project and create a new version of the **same Web App deployment**. Preserve the existing `/exec` URL in `js/brightace-api-config.js`.
3. Wait for the service worker v104 to activate, then use a private browser window or clear the old site data once. Persistent v103 client sessions are deliberately not migrated; clients may need to verify again.
4. Test with two different client accounts: account A must never see account B's messages, tutor records, or dashboard. Test a direct URL visit with no session, an expired session, logout, browser refresh, and a new browser tab.
5. Test the public soft navigation (Home, Subjects, About, FAQ, Terms, Privacy, Homework Help) and confirm title, CSS, browser back/forward, links, and forms/media fallbacks.
6. Test tutor photos from a real client account and verify the underlying Google Drive file is accessible to the intended audience.
7. Measure LCP/INP/CLS and API latency on the deployed site. No numeric speed improvement is claimed until those measurements are captured.

## Important security note
`sessionStorage` reduces unintended persistence but is not an authentication boundary. Every backend endpoint returning private data must validate the server-issued session and bind the requested conversation/work records to that verified client identity. Do not treat this source ZIP as a completed production security certification until deployment and staging isolation tests pass.
