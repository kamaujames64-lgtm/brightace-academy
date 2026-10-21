# BrightAce Academy V91 — Tutor Overview and Refund Balance Fix

## Changes made to the V90 package

- Tutor Overview: safe, idempotent dashboard reads now retry once after transient browser network failures. A remaining connection failure gives a specific BrightAce deployment/connectivity message instead of the unhelpful raw `Failed to fetch` error. Write actions are not automatically retried.
- Tutor-facing refund history: removed the numeric display of the 50% tutor-share adjustment. Confirmed refunds now display: “The 50% share of the refunded amount has been adjusted in your account.” Processing refunds display a processing message.
- Tutor account balance: confirmed refund adjustments are subtracted from the account balance. A zero or insufficient balance can become negative by the amount still owed; the available balance is no longer clamped to zero. This prevents the account from hiding a refund recovery.
- Withdrawal safety: withdrawal requests still must pass the backend's positive-available-balance and amount validation; a negative balance does not permit a withdrawal.

## Verification / deployment note

This is a source-package repair. The live Tutor Overview still depends on the deployed Google Apps Script Web App being reachable and on the matching backend being deployed. Run staging tests with a zero balance, a positive balance smaller than the adjustment, and a positive balance larger than the adjustment before production deployment.
