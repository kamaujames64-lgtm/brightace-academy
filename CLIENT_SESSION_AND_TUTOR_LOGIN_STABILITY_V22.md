# BrightAce Academy V22 — Client Session & Tutor Login Stability

Focused change only. Existing architecture/design/workflows preserved.

- Client Dashboard now reconciles its saved session with the active Live Chat v5 session before attempting restoration, preserving valid client session/access tokens.
- Server-side dashboard restoration can use the conversation's verifiedAt timestamp when lastActivityAt is missing, while retaining the existing 30-minute inactivity rule.
- Tutor lookup during sign-in now uses a short-lived cache and a targeted phone-column lookup instead of loading the entire tutor sheet, reducing unnecessary Apps Script work during verification.
- No payment, assignment, profile-picture, messaging, sound, deadline, or unrelated workflow changes.
