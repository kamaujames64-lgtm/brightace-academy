# BrightAce Owner SUPER_ADMIN Tutor Earnings Session Stability Fix V28

- Keeps the primary `owner` admin session valid for up to 10 years, with automatic renewal on use.
- Other administrator accounts retain the existing 30-day session lifetime.
- Keeps `owner` as `SUPER_ADMIN`.
- Tutor Earnings no longer displays the old "Your admin session is no longer valid..." sign-in instruction.
- Tutor Earnings no longer attempts a load while the page is hidden; it refreshes when the page becomes visible.
- All other application files and behavior are left intact.
- Deploy the updated `backend/Code.gs` to the same production Apps Script Web App used by the site, then sign in once as `owner`.
