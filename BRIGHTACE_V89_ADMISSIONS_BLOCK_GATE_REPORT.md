# BrightAce Academy V89 — Admissions and Restricted-Client Verification Gate

Date: 2026-10-21

## Scope

Built from the user's latest V88 website ZIP. This patch specifically addresses admissions-paused and blocked/suspended/inactive client flows before any verification UI is shown.

## Changes

1. **Public status preflight now checks both sources of restriction.** `publicRequestIntakeStatus` checks the WhatsApp block list and the client record status. `SUSPENDED` and `INACTIVE` client records are treated as restricted even if an explicit block-list row is missing.
2. **Blocked status wins before the admissions setting.** The public status response returns `{blocked:true, enabled:false}` without needing to read the intake setting, so an unset admissions configuration cannot hide the restricted-client message.
3. **Fail-closed admissions status.** If the admissions setting cannot be read, the public status response says `enabled:false`; new-client UI therefore shows the capacity popup and does not reveal verification. Returning clients can still use the existing verification path when they are not blocked because that path ignores the `enabled` flag and only checks `blocked`.
4. **Returning-client preflight.** The returning-client form checks access status before requesting a verification code or displaying the returning verification panel. Backend checks remain authoritative.
5. **Server-side race protection.** `startChat_`, new-client OTP delivery, and new-client OTP verification all check access restrictions. OTP delivery and verification also check admissions status, covering the race where an administrator pauses admissions after the first page check.
6. **Returning OTP endpoint protection.** Both returning-client code delivery and code verification reject blocked, suspended, and inactive contacts.
7. **Stale local session protection.** When the Live Chat page loads with an unverified pending session, it checks access and admissions before revealing the verification panel. A blocked client gets the service-access popup; a pending new request during paused admissions gets the capacity popup. A verified client with an existing session is not blocked merely because new admissions are paused.
8. **Popup on mid-flow rejection.** If a client becomes blocked or admissions are paused while the OTP screen is already open, the screen is hidden and replaced by the relevant popup.
9. **Cache invalidation.** Chat script URL and service-worker cache namespace were updated to prevent the browser from silently continuing to run V88 code.

## Files changed

- `backend/Code.gs`
- `js/chat.js`
- `pages/chat.html`
- `sw.js`
- `tools/brightace-v88-resource-test.js` (expanded and updated to V89)
- `tools/brightace-v89-admissions-gate-test.js` (new test entrypoint)
- `BRIGHTACE_V89_ADMISSIONS_BLOCK_GATE_REPORT.md` (this report)

The package preserves the other V88 public resource/media improvements and the earlier website files.

## Validation performed

- Expanded V89 source/contract suite: **43 passed, 0 failed**.
- `node --check` passed for browser JavaScript and test JavaScript.
- All Apps Script `.gs` source files passed Node syntax checking after being copied to temporary `.js` files for parsing.
- Inline JavaScript in `pages/chat.html`, `pages/admin-resources.html`, `pages/resources.html`, and `pages/resource-media.html` passed syntax checks.
- ZIP integrity check passed.

## Live deployment status — not verified from this environment

I attempted to open the current public GitHub Pages Live Chat URL and the configured Apps Script health endpoint. The web retrieval environment reported the URLs inaccessible, and the container could not resolve external DNS. I do not have the user's GitHub Pages deployment controls, Apps Script deployment permissions, or test client numbers/codes. Therefore I could not truthfully report a successful live browser/WhatsApp test or deploy this patch to production.

## Deployment and live test checklist

Deploy the V89 static files to GitHub Pages and deploy `backend/Code.gs` as a new version of the same Apps Script web app, keeping the existing `/exec` URL. Then test in a private/incognito browser:

1. Pause admissions in Admin. Enter a new-client name/phone and submit. Expected: the exact capacity popup appears; the new-client verification panel never appears and no OTP is sent.
2. While admissions remain paused, use **RETURNING CLIENT** with an active test client. Expected: existing verification works normally; no new request is created.
3. Block a dedicated staging/test client. Submit the new-client form with that number. Expected: the restricted-service popup appears before any OTP UI.
4. Suspend an existing client in Admin (including a client whose block-list row is absent, if you can safely prepare one in staging). Expected: the same restriction popup appears before verification.
5. Open Live Chat with a saved, pending, unverified browser session for a blocked client. Expected: the saved OTP screen is not rendered; the restriction popup appears.
6. Pause admissions after a test OTP is sent but before entering it. Expected: verification submission shows the capacity popup and the code cannot complete verification.
7. Unpause admissions and verify an active returning client. Expected: normal existing conversation access works.
8. Repeat on mobile and tablet viewport sizes; check keyboard focus, popup scrollability and that the verification screen never flashes behind the modal.

Use only dedicated staging/test accounts and test phone numbers. Do not test against real clients or trigger unsolicited WhatsApp messages.
