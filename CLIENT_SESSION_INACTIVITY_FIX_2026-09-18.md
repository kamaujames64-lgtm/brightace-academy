# CLIENT SESSION INACTIVITY FIX — 2026-09-18

Focused client-only stabilization change based on V7.

- Client inactivity is now governed by `lastActivityAt` with a strict 30-minute idle window.
- Active user interactions refresh local activity and server session state.
- Client pages schedule expiry from the actual last activity timestamp instead of blindly starting a fresh 30-minute window on page load.
- Expired client sessions are cleared and immediately returned to `pages/chat.html?session=expired`, which displays the existing “Start your support request” form so a new WhatsApp verification code can be requested.
- Client dashboard/tutoring/payments bootstrap no longer silently creates a brand-new session from an expired verified conversation. The existing client session token must still be valid.
- Backend session validation uses inactivity (`lastActivityAt`) as the authoritative 30-minute rule and refreshes the session expiry when a valid active session is used.
- Existing client navigation, payments, tutoring, chat, verification, styling and unrelated admin/tutor functionality were retained.
