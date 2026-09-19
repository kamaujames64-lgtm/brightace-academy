# ADMIN / HISTORY / SECURE PAYMENT STABILIZATION — 2026-09-18 V7

Focused changes only:
- Tutor Earnings uses the shared BrightAce admin token and performs an admin-session preflight before loading earnings/wallet/withdrawal data.
- History fetches both fresh work history and fresh active assignments, merges them by conversation/work ID, and shows a loading state while records are requested.
- Secure Payment creation has a clearer admin-facing preflight panel, clearer student-email requirement, and visible request-loaded status. Existing Paystack backend/payment flow is retained.
- No statement PDF, QR, stamp, client workflow, tutor payout rules, or unrelated UI logic was redesigned.
