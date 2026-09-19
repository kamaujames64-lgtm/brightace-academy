# BrightAce Owner SUPER_ADMIN Tutor Earnings Session Fix V32

Targeted fix only: preserve the previously working Tutor Earnings page and make the primary owner session resilient.
- Owner login issues an OWNER_-prefixed bearer token.
- Owner tokens receive a 10-year expiry immediately at login.
- If Google Apps Script cache/Script Properties temporarily loses an owner token record, the backend reconstructs the owner SUPER_ADMIN profile from the explicit owner token prefix.
- Other admin sessions remain unchanged at 30 days and still require their stored session record.
- Tutor Earnings UI, calculations, wallets, withdrawals and other pages are left intact.
