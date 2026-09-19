# BrightAce Academy V50 — Security, Abuse & Session Hardening

Build: `2026-09-19-V50-SECURITY-ABUSE-SESSION-HARDENING`
API marker: `brightace-json-v50`
Base: V49 `2026-09-19-V49-CLIENT-SESSION-RECOVERY-MESSAGING-WALLET`

## What V50 changes

### 1. Client session recovery is now consistent across dashboard and Live Chat
- A per-request `clientAccessToken` is treated as a post-verification credential, not as proof that the individual request still has the legacy `verificationStatus=VERIFIED` value.
- The token is still bound to the exact request and normalized WhatsApp number.
- Recovery remains limited by the existing 30-minute inactivity window.
- Direct dashboard calls with a valid access token can establish a fresh short-lived client session instead of falling into the old verification-status gate.
- Dashboard responses now carry the active client session token so a recovered session can be persisted by the frontend.

### 2. Live Chat can self-recover a rotated session
- The message GET path accepts the existing per-request client access token as a recovery credential.
- If the short-lived client session is rejected, Live Chat attempts one controlled bootstrap/recovery and retries message sync once.
- A refreshed client session token is stored locally and reused on later polls.
- Recovery is bounded to one retry per sync call to avoid loops.

### 3. Security/abuse regression coverage
The new `tools/brightace-v50-security-audit.js` checks:
- V50 build/API markers
- POST/GET action allowlists
- rate limiting
- client access-token phone binding
- removal of legacy `verificationStatus` as the session boundary
- inactivity enforcement
- GET-message recovery credential handling
- frontend session persistence
- absence of known server credential property names in frontend JavaScript
- duplicate top-level Apps Script functions
- retention of V48/V49 durable message delivery
- retention of tutor wallet session handoff

Result: **16/16 PASS**.

## Preserved from V49
- Complete client request history from V47
- Durable WhatsApp/message delivery queue and retry/dead-letter behavior
- Tutor Payment Wallet navigation/session handoff
- Admin history fast path
- Comprehensive admin transaction statement
- Deployment/version guard
- Existing frontend design and page structure

## Validation performed
- V50 security audit: **16/16 PASS**
- Backend delimiter/balance scan: **PASS**
- ZIP integrity check: performed before release
- No real production 500-user stress result is claimed. A live load test requires the deployed `/exec` to be reachable from the test environment.

## Deployment
1. Deploy the full `backend/` folder from this V50 package as a **new version of the same Apps Script Web App**.
2. Keep the existing production `/exec` URL.
3. Execute as the project owner and keep the existing required access setting.
4. Verify `/exec?action=health` returns JSON with:
   - `"ok":true`
   - `"build":"2026-09-19-V50-SECURITY-ABUSE-SESSION-HARDENING"`
   - `"api":"brightace-json-v50"`
5. Then publish/test the frontend.

V50 does not require a new client-facing design change or a new WhatsApp verification flow.
