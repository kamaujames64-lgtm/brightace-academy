# BrightAce Academy V110 — Public Navigation & Preloaded Tutoring Selection

**Release date:** 30 October 2026  
**Base:** BrightAce Academy V109 Public Navigation Fix (built from the supplied V108.1 website package)

## What V110 changes

### 1. Public website navigation

- Removed the public-page soft-navigation enhancer from the public page templates. Public menu links now use ordinary browser navigation and load the complete destination HTML document, stylesheets, and scripts together.
- Removed background HTML page prefetching from `js/app.js` to avoid speculative page requests racing with a user's click.
- Updated `sw.js` so the service worker does not intercept HTML document navigation at all. It continues to use network-only handling for protected documents and authentication-critical scripts, and network-first handling for static assets.
- Rebuilt `404.html` with self-contained styling (no relative CSS dependency at a nested URL) and a small recovery redirect for common route-depth and filename-case variants of known public pages.
- Updated `app.js` asset query versions on the HTML pages so browsers request the new navigation behavior.
- Packaged the repository contents directly at the ZIP root. There is no enclosing `brightace-v108-work/` directory. This is important when copying the release into the GitHub Pages publishing root.

### 2. Client Dashboard → My Tutors & Sessions

- Removed the tutoring-job dropdown and the separate “SELECT REQUEST” button.
- Made each complete tutoring request card clickable. Cards also support Enter/Space keyboard selection.
- The selected request has a visible blue border/background and an explicit “CURRENTLY VIEWING” label.
- Selecting a card updates the `request` query parameter with `history.replaceState` and redraws the tutor profile, assignment information, next session, session history, tutor updates/submissions, QA notes, and client feedback for that Work ID. The user stays on the same dashboard page.
- The card's MESSAGE link remains a separate action and does not trigger card selection.
- Added tutor avatars to request cards. Tutor profile data and image URLs are returned for all assigned jobs during the initial load.
- The selection handler uses the already-loaded response object; it does not call `post()` or `fetch()` when a user changes the selected job.

### 3. Backend preload

`backend/Code.gs` expands `clientTutorSessions_` to return, in the initial authenticated request:

- All of the client's tutoring requests and each request's assigned tutor profile information.
- All schedules for the client's Work IDs.
- Client feedback text, timestamp and rating for each request.
- Tutor submission note/time and QA status/notes/time for each request.
- Tutor-authored messages and submission attachment metadata across the client's Work IDs.
- Existing session-booking requests.

The endpoint remains scoped to the authenticated client's own phone number and conversation IDs. The response cache was moved to a V4 key, and cache invalidation was updated for the new payload.

## Exact files changed from V109

**Core navigation and tutoring behavior**

- `404.html`
- `README.md`
- `backend/BA_Speed.gs`
- `backend/Code.gs`
- `css/client-portal.css`
- `index.html`
- `js/app.js`
- `js/client-portal-pages.js`
- `sw.js`

**HTML asset-version refreshes and public navigation template cleanup**

- `admin-tutor-earnings.html`
- `pages/about.html`
- `pages/admin-assignments.html`
- `pages/admin-clients.html`
- `pages/admin-history.html`
- `pages/admin-login.html`
- `pages/admin-observability.html`
- `pages/admin-payments.html`
- `pages/admin-production-qa.html`
- `pages/admin-profile.html`
- `pages/admin-python.html`
- `pages/admin-quality.html`
- `pages/admin-reports.html`
- `pages/admin-resources.html`
- `pages/admin-scheduling.html`
- `pages/admin-team.html`
- `pages/admin-tutor-earnings.html`
- `pages/admin-tutors.html`
- `pages/admin.html`
- `pages/chat.html`
- `pages/client-tutoring.html`
- `pages/contact.html`
- `pages/faq.html`
- `pages/homework-help.html`
- `pages/how-it-works.html`
- `pages/payment.html`
- `pages/privacy.html`
- `pages/receipt.html`
- `pages/resource-checkout.html`
- `pages/resources.html`
- `pages/subjects.html`
- `pages/terms.html`
- `pages/tutor-earnings.html`
- `pages/tutor-messages.html`
- `pages/tutor-profile.html`
- `pages/tutor-sessions.html`
- `pages/tutor-wallet.html`
- `pages/tutor-work.html`
- `pages/tutor.html`

**Regression tests updated**

- `tools/brightace-v100-responsive-tutoring-phone-test.js`
- `tools/brightace-v102-security-gate-test.js`
- `tools/brightace-v104-performance-privacy-photo-test.js`
- `tools/brightace-v105-workspace-regression-test.js`
- `tools/brightace-v106-session-workflow-test.js`
- `tools/brightace-v107-client-history-performance-test.js`
- `tools/brightace-v108-repair-test.js`
- `tools/brightace-v1081-tutoring-job-selection-test.js`
- `tools/brightace-v109-public-navigation-test.js`
- `tools/brightace-v88-resource-test.js`
- `tools/brightace-v92-fetch-recovery-test.js`
- `tools/brightace-v98-client-navigation-payment-test.js`

No existing backend spreadsheet schema or payment/session action was intentionally changed.

## Validation performed

- All JavaScript syntax checks passed for `js/client-portal-pages.js`, `js/app.js`, `sw.js`, `backend/Code.gs`, and `backend/BA_Speed.gs`.
- All 15 runnable `tools/brightace-v*.js` regression suites passed. The 14 suites with numeric counters total **316 source-level assertions**; the V110 public-navigation suite additionally audited local links across the public navigation pages and confirmed their targets exist in this package.
- The focused tutoring-selection test passed **10/10** checks, including no dropdown, whole-card selection, visible selected state, keyboard access, preloaded data, and no new backend request on selection.
- ZIP integrity was checked after packaging.

## Deployment requirements and limits

1. Back up the currently deployed website and Apps Script project.
2. Extract the ZIP and copy its **contents** (including `index.html`, `pages/`, `css/`, `js/`, `backend/`, `sw.js`, and `.nojekyll`) into the exact GitHub Pages publishing root. Do not upload the enclosing ZIP folder as a subfolder.
3. Publish the GitHub Pages changes. The ZIP does not publish itself.
4. Deploy the updated `backend/Code.gs` and `backend/BA_Speed.gs` to the existing Apps Script Web App as a new version, preserving the existing `/exec` URL and script properties referenced by `BRIGHTACE_API_URL`. The frontend's preloaded tutor updates and feedback fields will not be available until this backend deployment is updated.
5. After deployment, open the website and hard-refresh once (`Ctrl+F5`) so the new service worker takes control. Test public navigation from Home, Subjects and Resources, and test multiple tutoring requests using a staging client account.

**Not claimed:** This package has not been deployed to the live GitHub Pages site or Apps Script endpoint, and it has not been browser-tested against the live domain. The reported 404 can only be conclusively traced to a live URL/deployment configuration after the package is published and the exact failing URL is observed. The V110 changes remove the known partial-navigation/prefetch/page-cache paths and make the package layout GitHub Pages-ready, but cannot correct a repository publishing-source or branch setting that points somewhere else.
