# BrightAce Tutor Earnings — Complete Repair V34

This update preserves the existing BrightAce visual design and focuses only on Tutor Earnings data/authentication reliability.

## Fixed
- Tutor Earnings now uses one consolidated authenticated backend request for the earnings workspace.
- Added `adminListTutorEarningsDetails` to return balances, payout/work records, tutor payment history, withdrawal requests, and wallets together.
- Legacy paid work is reconciled into tutor payout records before earnings details are returned.
- Withdrawal requests are returned with status, requested/reviewed timestamps, payment reference, admin record, recipient and linked wallet details.
- Payment history includes payments recorded from ordinary tutor payments and withdrawal settlements.
- Earnings work detail links payout records back to the underlying conversation/work and student information when available.
- Tutor Earnings now falls back through all supported browser admin-session token locations if an older/stale token is present.
- Owner-session recovery remains supported by the backend.
- Session expiry now redirects cleanly to Admin Sign In instead of leaving the Tutor Earnings page in a misleading state.
- Tutor Earnings refreshes while visible every 30 seconds and on return to the tab.

## Design preservation
No global CSS, logo, colors, typography, navigation structure, dashboard design, client pages, tutor pages, payment pages, or other application features were intentionally changed.

## Deployment
The repaired `backend/Code.gs` must be deployed as a new version of the same Google Apps Script Web App. The existing production `/exec` URL remains the configured endpoint.
