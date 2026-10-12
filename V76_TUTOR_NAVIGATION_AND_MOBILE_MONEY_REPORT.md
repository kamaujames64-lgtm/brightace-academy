# V76 — Tutor Navigation and Mobile Money Wallet UX Fix

## Requested changes
- Standardize tutor navigation across Overview, Assigned Work, Sessions & Work, Earnings & Withdrawals, Admin Messages, Settings, and Log out.
- Remove Payment Wallet as a top-level navigation item to avoid duplicating the wallet link under earnings.
- Keep the standalone Payment Wallet page and make it reachable from the tutor dashboard's earnings section and existing dashboard wallet shortcut.
- Ensure mobile-money selection displays required provider and preferred mobile-number fields on both wallet forms.

## Implementation
- Updated the same navigation markup on `tutor.html`, `tutor-work.html`, `tutor-wallet.html`, `tutor-messages.html`, and `tutor-profile.html`.
- Added a consistent Log out button on every tutor page, clearing the tutor session token and returning to the tutor entry page.
- Renamed the mobile-money inputs to **Mobile money provider** and **Preferred mobile number**, with appropriate autocomplete/input modes and clearer examples. Existing conditional field logic makes those two inputs visible and required when Mobile Money is selected.
- Added a **Manage Payment Wallet** shortcut under Earnings & Withdrawals, while preserving the existing wallet page and backend save/load actions.
- Preserved V75's fixed navy-and-gold responsive navigation styling and destinations.

## Validation
- Five tutor pages contain the same seven top-level controls (six links plus Log out).
- Payment Wallet is not a top-level nav item, but remains available from the Earnings & Withdrawals area and existing dashboard shortcut.
- Both wallet forms include provider and preferred mobile-number fields and the `walletFields()` conditional visibility/required-field logic.
- JavaScript syntax and ZIP integrity checks are performed for this package.
- No live backend session or physical-device browser testing was performed.
