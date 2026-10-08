# BrightAce V66 — Global USD Currency + Current Client Dashboard Guide

Base package: **BrightAce-V66-FLAGS-SEARCH-BRANDED-20261003.zip**

## Currency
- Default website display currency is **USD**.
- A BrightAce-branded `Display currency` control is available across all 46 HTML pages.
- Supported display currencies: USD, EUR, GBP, CHF, CAD, AUD, NZD, JPY, CNY, SGD, HKD, AED, SAR, ZAR, NGN, GHS, KES, UGX, TZS, RWF, ETB, EGP, INR, PKR, BDT, MYR, THB, TRY and BRL.
- FX rates are fetched by Apps Script from `open.er-api.com` and cached for one hour. A safe fallback table is used only if the live provider is unavailable.
- Conversion is **display-only**. Stored transaction amounts, invoice currencies, payment requests, tutor balances, withdrawals and accounting records are not rewritten.
- Official financial statements continue to preserve the original transaction currency for accounting integrity.
- New public/client request budget forms now default to USD while retaining the existing supported payment currencies (KES/USD/EUR).

## Client tutorial
- Replaced the old V4 onboarding guide with V5.
- The guide now describes the current dashboard structure: Dashboard Home, New Request, My Requests, Assignments & Work, Tutor & Zoom Sessions, Messages, Payments, Resources and Profile.
- New BrightAce-branded tutorial presentation with navy/teal/gold styling.
- Existing clients receive the current guide once because the onboarding storage key was intentionally versioned from V4 to V5.

## Backend
- Added `backend/BA_Currency.gs` with one-hour cached FX endpoint.
- Added `fxRates` to the GET dispatch in `backend/Code.gs`.
- Added `fxRates` to the allowed GET action list in `backend/BA_Security.gs`.

## Validation
- All frontend `.js` files pass `node --check`.
- All backend `.gs` files pass JavaScript syntax validation after temporary `.js` conversion.
- All 46 HTML pages include the global currency script.
