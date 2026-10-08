# BrightAce V66 Spreadsheet Alignment — 2026-10-06

Aligned the workbook contract to the current V66 frontend/backend package.

Active backend sheets now have exact contract names and headers:
CLIENTS, BLOCKED_WHATSAPP, RESOURCES, RESOURCE_PURCHASES, RESOURCE_ACCESS,
OPERATIONAL_EVENTS, STATEMENT_REGISTRY, TUTOR_PAYMENT_HISTORY, TUTOR_WALLETS,
TUTOR_WITHDRAWALS, ACTIVITY_LOG, TUTOR_AVAILABILITY, SCHEDULES, TUTOR_MESSAGES,
ADMIN_ACTIVITY, REFUND_REQUESTS, TUTOR_PAYOUTS, TUTORS, PAYMENTS, CONVERSATIONS,
MESSAGES, MESSAGE_DELIVERY_QUEUE.

Important data repairs:
- TUTORS: corrected the mixed legacy/new column ordering while preserving row values.
- CONVERSATIONS: corrected the verification/admin tail-column ordering.
- PAYMENTS: removed unused blank/paymentSequence columns from the active contract.
- Added RESOURCE_ACCESS and MESSAGE_DELIVERY_QUEUE, which the current backend uses.
- Phone-number cells were converted to text so country-code numbers are not silently converted to numeric values.

Legacy tabs CLIENT_PREFERENCES and CLIENT_SESSIONS were preserved because they contain historical data, but they are not active sheet contracts in the current V66 backend.

Backend addition:
- backend/BA_SpreadsheetSchema.gs provides brightAceAlignSpreadsheetSchema() to verify/create missing contract sheets.
