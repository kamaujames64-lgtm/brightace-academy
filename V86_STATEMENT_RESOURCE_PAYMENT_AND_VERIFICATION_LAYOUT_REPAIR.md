# BrightAce Academy V86 — Statement Payments & Verification Layout Repair

## Starting point
Built from `BrightAce-Academy-V86-Resources-Upload-Type-Fix.zip`, retaining the prior upload-signature fix.

## Changes made

### 1. Client statement integration
- Added verified paid purchases from `RESOURCE_PURCHASES` to the client statement.
- Added paid custom-resource quotations from `RESOURCE_REQUESTS` when `quotePaymentStatus` is `PAID`.
- Added resource refund activity when a refund amount and refund date are recorded.
- Matched records against the authenticated client's email and/or normalized phone number.
- Converted USD resource transactions into the client's selected display currency using the existing currency conversion helper, while preserving original amount/currency fields.
- Excluded pending/failed resource purchases and unpaid quotations from client financial transactions.

### 2. Owner/admin statement integration
- Added paid digital-resource purchases from `RESOURCE_PURCHASES`.
- Added paid custom-resource quote payments from `RESOURCE_REQUESTS`.
- Added resource refunds as outgoing transactions.
- Restricted general service-payment entries to status `PAID`, so pending/unpaid requests do not appear as completed cash receipts.
- Retained existing client refund and tutor payout handling.

### 3. Statement verification page layout
- Added responsive `box-sizing`, `min-width: 0`, safe word wrapping, and overflow boundaries to the verification card and each detail frame.
- Long integrity hashes, IDs, references, email addresses and other long values now wrap inside their own cells instead of pushing outside the frame.
- Mobile verification details switch to a single-column layout.
- Verification now displays the success message only when the API explicitly returns `verified: true`; an unverified/invalid record is shown as an error instead of being described as authentic.

## Checks run
- JavaScript syntax checks: passed for all 24 included `.js` files.
- Apps Script syntax checks: passed for all 26 `.gs` files using Node's JavaScript parser.
- Inline scripts in `pages/verify-statement.html`: passed.
- Static assertions confirmed resource purchase, resource quote, resource refund and strict verification branches are present.
- ZIP integrity test: passed.

## Not verified without production access
- No live Google Sheets, Drive, Apps Script deployment or Paystack callback was accessed.
- End-to-end test payments and statement downloads were not executed against production.
- Deploy the updated Apps Script files to the existing web-app deployment, then test a paid resource purchase, a paid custom-resource quote, a general service payment and a resource refund. Generate and scan a new statement QR code for each relevant statement type.
- Previously generated statements are immutable historical snapshots and will not retroactively gain newly added transaction rows; generate a fresh statement after deployment to include the new integration.
