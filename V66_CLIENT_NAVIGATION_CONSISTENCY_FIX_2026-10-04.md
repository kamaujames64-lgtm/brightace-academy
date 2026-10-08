# BrightAce V66 — Client Navigation Consistency Fix — 2026-10-04

Base package: BrightAce-V66-SPEED-JSON-STABLE-FINAL-20261004.zip

## Changes
- Removed the “Small steps every day lead to big results!” promotional block from the client sidebar navigation and the dashboard quote card.
- Restored a visible desktop collapse/expand arrow on the shared client sidebar and the dashboard client sidebar.
- Collapse state is persisted in the browser and the control is hidden on mobile, where the existing hamburger menu remains the navigation control.
- Added “New Request” as a permanent first-class item to the shared client workspace navigation.
- Added “New Request” to the dashboard sidebar and mobile client navigation.
- Added “New Request” to legacy client financial/checkout navigation surfaces so the entry remains available while moving through those client pages.
- Removed the Resources, Sessions, and Messages shortcut buttons from the right side of the client dashboard search bar.
- Corrected the shared Messages unread-badge selector so it attaches to the actual client Messages navigation item.

## Changed files
- js/client-portal-pages.js
- css/client-portal.css
- pages/client-dashboard.html
- pages/client-statement.html
- pages/payment.html
- pages/receipt.html
- pages/resource-checkout.html
- README.md

No backend `.gs` files were changed.
