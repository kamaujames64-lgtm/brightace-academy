# BrightAce Academy V47 — Client History + 500-User Readiness

## Primary requirement
Every request ever created for a verified client's WhatsApp number must appear in the client's request section and remain openable, unless a Super Admin permanently deleted that request.

## Implemented
- Added `backend/BA_ClientHistory.gs`.
- Client history is keyed by verified WhatsApp number and uses the V43 conversation index.
- Historical requests are no longer excluded because an older row has a missing/legacy `verificationStatus`.
- `clientConversationFromSession_` authorizes historical requests by the verified client session plus phone ownership.
- Permanent Super Admin deletion invalidates the client's history/index caches.
- New request creation invalidates the client's request index.
- Incoming WhatsApp-created client conversations invalidate the same index.
- Work/assignment cache invalidation also clears the client history cache.
- Client dashboard now labels the section `All Requests` and explicitly explains the deletion rule.
- Existing V44 financial statement functionality, V45 deployment guard, and V46 Admin History fast path are retained.

## Security boundary
The client session remains required. The change does NOT allow a client to open another client's request. The request conversation's normalized student phone must match the verified session phone.

## Performance
- Normal history reads use short-lived cache.
- Conversation IDs come from the indexed phone lookup.
- Each returned request is compact rather than returning the full internal conversation/session object.
- New/deleted/assignment changes invalidate the relevant cache so history does not intentionally remain stale.
- Load-test harness now supports read-only `clientDashboard` and `clientGetRequest` actions.

## 500-user test status
A real production 500-user result is not claimed unless the load test is run against the deployed `/exec`. The package includes the read-only harness and V47 static audit.

Example:
`API_URL="https://.../exec" CONCURRENCY=500 TOTAL=500 ACTION=clientDashboard CLIENT_SESSION_TOKEN="..." PHONE="..." node tools/brightace-load-test.js`

For request-detail testing:
`ACTION=clientGetRequest CONVERSATION_ID="..." CLIENT_SESSION_TOKEN="..." PHONE="..."`

## Validation
- Backend `.gs` syntax: PASS
- Duplicate top-level function names: 0
- Client dashboard inline JavaScript syntax: PASS
- V47 static contract audit: included
