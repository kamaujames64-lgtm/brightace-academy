# BrightAce v103 + Supersonic Engine integration and session-hardening notes

## Included in this combined package
- Added `js/brightace-speed-engine.js` and `css/brightace-speed-engine.css`.
- Integrated the engine on the homepage and selected public informational pages only (10 pages).
- The engine supports safe prefetch/image optimizations; protected/admin/client/tutor/chat/payment routes are excluded by its route filter.
- Changed client chat and client portal session storage so the client verification/session token is kept in `sessionStorage` rather than persistent `localStorage`. This reduces unintended session persistence across browser restarts/new browser sessions. Existing server-side token validation remains required.

## Important finding from the supplied screenshot
The screenshot shows a client chat UI with a named conversation, historical message content, and Dashboard / Exit / Log Out controls. That is sensitive client UI. The frontend source does call `clientDashboardBootstrap` before restoring a stored chat session and the portal calls protected API actions, but source review cannot prove the currently deployed Apps Script validates every request correctly.

## Required production action — not completed here
1. Deploy the updated static files to GitHub Pages.
2. Deploy the corresponding backend `.gs` source to the SAME Google Apps Script Web App deployment URL, after review.
3. Test in a fresh private window and a second browser profile: direct-open every client/tutor/admin route; no private records or messages should render before server validation.
4. Confirm the backend rejects missing, expired, revoked, wrong-phone, and cross-client tokens for every protected action.
5. Revoke any client session tokens that may have been exposed, if the screenshot/browser was shared or public.

## Limitations
- This package does not change or deploy the live GitHub Pages site or Google Apps Script service.
- SessionStorage reduces persistence but is not a substitute for server-side authorization. Static pages can still be opened; private data/actions must be protected by the backend.
- Speed improvements are not quantified until browser performance tests run on the deployed site.

## Country selector default
The phone picker now prefers the browser's explicit country locale when available; if there is no usable country locale, it defaults to Kenya (+254) rather than assuming US (+1). A country explicitly inferred from an already-entered number still takes precedence.
