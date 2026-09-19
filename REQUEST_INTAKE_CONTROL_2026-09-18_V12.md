# BrightAce Academy — New Client Request Intake Control — 2026-09-18 V12

- Client WhatsApp numbers remain unrestricted by default; only explicitly blocked/suspended numbers are rejected.
- Admin Dashboard now has **NEW REQUESTS: ON/OFF**.
- OFF pauses only genuinely new client numbers. Existing client numbers can still start requests and complete WhatsApp verification.
- When OFF, a new number receives: “We are not taking in new requests right now. Please check again in the next 24 hours.”
- Setting is stored in Apps Script Script Properties and survives page refreshes/deployments.
- Admin actions are protected by the existing admin permission/session system and audit logging.
