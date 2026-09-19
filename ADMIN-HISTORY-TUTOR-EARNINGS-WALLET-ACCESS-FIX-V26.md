# BrightAce Academy — V26

Focused access/loading fix only.

- Fixed `knownPaymentSignature is not defined` in `pages/admin.html` by initializing the payment signature state before admin refresh runs.
- Admin History read access is now available to any authenticated admin, without requiring the separate REPORTS permission. Existing authentication remains.
- Admin History now uses the current Admin session token variants and no longer forces every normal load to bypass the server cache. Manual refresh remains available.
- Tutor Earnings read-only actions remain available to authenticated admins without unrelated REPORTS permission restrictions.
- Tutor Wallet remains identity-protected by the tutor's authenticated session; no financial/security bypass was introduced.
- No payment, payout, withdrawal, client, tutor, or site architecture redesign was made.
