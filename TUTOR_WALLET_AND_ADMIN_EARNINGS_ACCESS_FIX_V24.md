# BrightAce Academy V24 — Tutor Wallet & Admin Tutor Earnings Access Fix

Focused change based on V23.

- Tutor wallet now recovers the tutor token from persistent browser storage as well as session storage, preventing the wallet page from falsely appearing signed out when opened through navigation/new-tab flows.
- Admin tutor earnings now accepts authenticated admin sessions for its read-only session profile, tutor balances, tutor wallets, and tutor withdrawal listing actions without requiring an unrelated permission category. Financial mutation actions remain permission-controlled.
- Existing tutor/admin authentication, payout rules, withdrawal minimum, ledger calculations, messaging, profile pictures, history, sounds, deadline reminders, and other functionality are unchanged.
