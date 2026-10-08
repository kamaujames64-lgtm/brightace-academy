# BrightAce V66 — Currency Financial Documents + Performance Fix — 2026-10-04

## Currency behavior
- USD is the default client display currency.
- Supported primary/major currencies include USD, EUR, KES, CNY, INR, GBP, JPY, CAD, AUD, CHF, SGD, AED, ZAR, NGN and additional supported currencies already present in V66.
- The client's selected display currency is stored in the CLIENTS sheet as `displayCurrency`.
- The original payment/refund amount and source currency are never rewritten.
- Client invoices/receipts and official client statements are rendered in the selected display currency.
- Converted documents retain `originalAmount` and `originalCurrency` so the source transaction remains auditable.
- Official statement PDF uses the selected display currency for totals and transaction amounts, with original currency shown as a secondary audit reference when different.
- Currency selection is also synced server-side from the browser session, so invoice/statement pages remain consistent across page changes and browser tabs.

## Performance
- Added `backend/BA_FastIndex.gs`.
- Client lookup uses cached row index -> Sheets TextFinder -> normalized phone-column scan fallback.
- Payment/refund client history uses cached phone indexes and targeted row reads instead of repeatedly loading entire Sheets matrices.
- Conversation-by-phone lookup uses the same fast index path.
- Payment/refund writes invalidate affected client indexes immediately.
- Existing CacheService remains fail-open; Sheets remains the source of truth.
- No global DOM MutationObserver was reintroduced.

## Changed files
- `backend/Code.gs`
- `backend/BA_Currency.gs`
- `backend/BA_FastIndex.gs` (new)
- `backend/BA_Security.gs`
- `backend/BA_Validation.gs`
- `js/brightace-currency.js`
- `js/statement-pdf.js`
- `pages/client-statement.html`
- `pages/receipt.html`
- `README.md`

## Deployment
Deploy all `.gs` files in the `backend/` folder, including the new `BA_FastIndex.gs`, as one Apps Script deployment. Deploy the updated frontend files together so the client currency preference and document conversion stay in sync.
