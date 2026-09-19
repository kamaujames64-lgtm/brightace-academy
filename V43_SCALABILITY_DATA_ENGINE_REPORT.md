# BrightAce Academy V43 — Scalability / Data Engine Pass

## Scope
V43 builds on V42 without redesigning the existing BrightAce pages. The focus is high-frequency read paths, bounded sheet access, cache reuse, and incremental synchronization.

## Changes
- Added `baConversationIdsForPhone_()` with a short-lived per-client conversation-ID index.
- Reworked `clientAllMessages_()` to assemble recent messages from per-conversation cached reads instead of loading the entire MESSAGES sheet plus the entire CONVERSATIONS sheet on every miss.
- Reworked `findPaymentRequest_()` to use an exact-column TextFinder lookup and a short-lived per-request cache instead of `getDataRange()` scanning.
- Reworked `clientGetRequest_()` to use bounded exact-conversation lookups for SCHEDULES and PAYMENTS, with 30-second caches.
- Added cache invalidation for conversation schedule/payment views and paid-payment transitions.
- Extended the expensive tutor dashboard cache from 2 seconds to 8 seconds while retaining existing invalidation behavior.
- Retained V42 incremental message cursors and idempotent message delivery.
- Added `tools/brightace-v43-audit.js` for repeatable static hot-path checks.

## Deliberately unchanged
- Existing client/admin/tutor page design.
- Existing production `/exec` URL.
- Existing Sheets source of truth.
- Existing authentication/authorization flow from V42.
- No destructive schema migration.

## Important limitation
A real 500-client production concurrency result is not claimed here. It must be run against the deployed `/exec` endpoint from a network environment that can reach the Apps Script service.

## Next likely bottlenecks
1. `tutorDashboard_()` still assembles several maps from full sheets on cache misses.
2. `clientDashboard_()` still reads broad client/tutor datasets on cache misses.
3. Several admin list endpoints still read complete sheets.
4. `readConversationMessages_()` still has a bounded last-2,000-row fallback when its message cache is cold.
5. High-volume messaging beyond Apps Script/Sheets' comfortable range should eventually move to a dedicated database.

## V44 candidate
Build a persistent lightweight index/denormalized read model for conversations, messages, schedules and payments, then benchmark the deployed service with a mixed 500-client workload before deciding whether Cloud SQL or another dedicated store is necessary.
