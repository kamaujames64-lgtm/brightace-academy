# ADMIN IMMEDIATE CONSISTENCY + SELF PASSWORD FIX — 2026-09-18

- Fixed stale admin browser token selection: the current tab's sessionStorage token is preferred over an older localStorage token.
- Admin sign-in now clears v4/v3 stale browser tokens before saving the newly authenticated token.
- Dedicated admin sign-in page no longer redirects merely because any old token exists; sign-in is an intentional flow.
- Added authenticated `adminChangeOwnPassword` backend action with current-password verification, 8-character minimum, Script Lock, and audit logging.
- Added Change My Admin Password UI to Admin Team.
- `adminAddAdmin` now returns the complete current administrator list after a successful write so the current screen updates without a manual refresh.
- Admin Team broadcasts successful admin-list changes across open tabs; other Admin Team tabs synchronize automatically.
- Existing client, tutor, payment, assignment, navigation, and background synchronization behavior is otherwise unchanged.
