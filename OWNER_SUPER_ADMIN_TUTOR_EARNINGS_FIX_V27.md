# BrightAce Owner SUPER_ADMIN + Tutor Earnings Stability Fix V27

- `owner` is forcibly normalized to `SUPER_ADMIN` in `getAdminUsers_()` and the login token profile.
- SUPER_ADMIN bypasses the permission map, including tutor earnings/wallet/withdrawal actions.
- Tutor Earnings no longer hard-redirects to Admin Sign In merely because an old/missing browser token is present.
- Authentication failures are shown as an inline session message instead of silently bouncing the user away.
- The live Google Apps Script `/exec` deployment MUST be redeployed with `backend/Code.gs` from this ZIP. The ZIP itself cannot update an already-published Apps Script deployment.
- After deployment, sign in once as `owner`, then open Tutor Earnings.
