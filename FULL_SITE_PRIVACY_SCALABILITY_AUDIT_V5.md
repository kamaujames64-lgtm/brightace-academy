# BrightAce Academy — Full-Site Privacy & Scalability Audit (v5)

Audit base: latest supplied `brightace-academy-responsive-access-controls-v4.zip`.

## Changes applied in this package

- Added periodic cleanup for expired `BA_ADMIN_TOKEN_*` and `BA_TUTOR_TOKEN_*` Script Properties. Previously expired, unused token records could remain indefinitely and gradually consume the Apps Script project's limited property storage. Cleanup is throttled to at most once every five minutes and removes only expired/invalid session records.
- The cleanup is invoked during admin login and tutor verification login. It does not alter active, unexpired sessions or client records.
- Preserved the v4 profile-photo, responsive-navigation, admissions pause, and blocked-contact changes.

## Privacy boundaries found in static inspection

- Client portal data functions validate the client session against the submitted normalized phone number before returning cached client portal, summary, and tutor/session responses. Client caches are keyed by normalized phone number, and conversation-level reads compare the conversation owner phone to the verified client.
- Tutor dashboard access starts by validating the tutor bearer token, and work rows are filtered against the authenticated tutor phone/identity. Tutor session bookings are filtered by tutor phone.
- Message reads authorize the conversation before returning its cached message stream. Client live chat filters out tutor-only messages.
- Admin actions generally call `requireAdmin_`; destructive/high-privilege actions also use `requireSuperAdmin_` where defined.

These are static code observations, not proof that every endpoint is secure. A dedicated cross-account authorization test is still required for every read/write action, including file attachments, payment/refund paths, resources, schedules, and exports.

## Remaining high-priority risks (not honestly fixable by a small ZIP-only patch)

1. **2,000 concurrent users is not verified and should not be promised on the current Apps Script + Google Sheets architecture.** Several hot paths scan full sheets with `getDataRange().getValues()` (including tutor dashboard aggregation). Google Apps Script execution concurrency, per-user/per-script quotas, Sheets read/write quotas, and Drive operations can become bottlenecks. Run a real load test and plan to move high-volume transactional/session data to a database/API designed for concurrent traffic before launch at that scale.
2. **Script Properties is not a session database.** This patch cleans expired admin/tutor tokens, but active bearer tokens are still persisted there for cache-miss recovery. For large scale, move session records to a suitable session store and rotate/revoke tokens centrally.
3. **Rate limiting is intentionally fail-open if CacheService errors.** This avoids taking the whole site down during cache faults but weakens abuse protection during those faults. Use a durable, atomic rate limiter at the API gateway/database layer for production traffic.
4. **Admin permissions default to backwards-compatible allow when an admin's permission list is empty.** Review and migrate all admin accounts to explicit least-privilege permissions before relying on granular roles.
5. **The Apps Script endpoint exposes many actions in a single large router.** Every action needs a systematic authorization matrix test, including unauthenticated endpoints and IDOR attempts using another user's conversation, booking, request, payment, resource, or file ID.

## Required release gates

- Test with two clients, two tutors, and two admins; attempt cross-account reads and writes with copied IDs and swapped tokens/phones. Every unauthorized request must fail without returning personal data.
- Test profile images and file attachments with private/non-public Drive permissions.
- Test session expiry, logout/revocation, blocked contacts, paused intake, and cache-miss recovery.
- Run load tests from a separate environment against the deployed Apps Script `/exec` endpoint, ramping gradually and monitoring p95/p99 latency, errors, quota failures, and data correctness. A 2,000-user target needs a defined concurrency profile (active requests per second, polling intervals, uploads, and peak write rate).
- Verify payments, refunds, tutor balances, and booking conflicts under simultaneous writes.
- Review logs and error payloads to ensure they never contain passwords, bearer tokens, verification codes, payment secrets, or private message/file content.

## Validation performed for this archive

- Archive integrity check.
- JavaScript syntax checks for backend `.gs` files and frontend `.js` files.
- Static inspection of session validation, per-user cache keys, message authorization, and major full-sheet read paths.

Not performed: live API tests, authenticated end-to-end tests, penetration tests, Apps Script quota checks in the owner's deployment, physical mobile-device tests, or a 2,000-concurrent-user load test.
