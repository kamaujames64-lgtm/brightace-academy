# BrightAce Academy — Currency Display Conversion V18

Focused change only: Admin Tutor Earnings and Tutor Payment Wallet can display monetary amounts in a selected currency.

- Added compact Display money in selector: KES, USD, EUR, GBP, UGX, TZS, ZAR, NGN, GHS.
- Uses live exchange-rate data when available and caches rates locally for one hour.
- Original transaction currency, ledger amount, tutor payout, withdrawal amount, and accounting records are unchanged.
- Conversion is display-only; it does not convert or rewrite stored balances.
- If the rate service is unavailable, the original currency/amount remains visible and the UI reports conversion unavailable.
- Existing withdrawal rules and payment workflows remain intact.
