# OWNER SUPER ADMIN FIX — V26

Applied owner authorization hardening to `backend/Code.gs`.

- The administrator with username `owner` is always issued the `SUPER_ADMIN` role.
- If `ADMIN_USERS_JSON` contains an older or incorrect role for `owner`, the backend now overrides it to `SUPER_ADMIN`.
- The same rule is used when listing administrators, so the owner is displayed as `SUPER_ADMIN`.
- The owner username remains `owner` for now. When you later change the displayed name to `MugoKamau`, keep the username `owner` unless you intentionally want to migrate the owner username.
- All existing non-owner admin roles remain unchanged.
- Tutor earnings, tutor wallets, withdrawal/payment administration, history, and other super-admin protected actions therefore use the owner's `SUPER_ADMIN` authorization.

After deploying this backend, sign out of the admin account and sign back in to receive a fresh SUPER_ADMIN session token.
