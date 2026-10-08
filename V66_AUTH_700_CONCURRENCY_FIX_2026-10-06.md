# BrightAce V66 — Authentication + 700-Concurrent-User Hardening — 2026-10-06

## Problems addressed
- `/exec` must return the V66 JSON API, not an Apps Script HTML error/login page.
- Admin sign-in now validates the newly issued token against `adminSessionProfile` before redirecting.
- Client 30-minute session validation is cache-first instead of reading/writing the CLIENTS sheet on every authenticated request.
- Session activity is persisted to Sheets at most once every five minutes per active session; CacheService remains the hot-path session state.
- The 30-minute inactivity security boundary is unchanged.
- Sheets remains the source of truth for client records and durable session issuance.

## 700-user architecture target
The package is hardened for approximately 700 concurrent clients/tutors/admins by reducing repeated Sheets writes on authenticated client hot paths. This does not remove Apps Script/Sheets quotas; production load should still be load-tested against the actual Google account/project quotas.

## Deployment
Update the existing production Web App deployment to the latest version. Do not create a second production `/exec` URL.
