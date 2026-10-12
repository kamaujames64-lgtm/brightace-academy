# BrightAce V66 — Currency Converter UI + JSON Deployment Fix

## Currency converter
- Reworked the existing BrightAce currency converter to match the supplied reference direction: dark teal background, large white converter cards, large amount fields, currency flags, swap control, rate line, and popular-currency list.
- Kept the display-currency model unchanged: conversions are display-only and original payment/transaction currencies are not rewritten.
- Reused the bundled BrightAce flag font for reliable country flags without a CDN dependency.
- Preserved cached FX rates and the USD default.

## Production /exec JSON issue
- The V66 source backend already returns JSON for `health` and `version` and identifies itself as `2026-10-04-V66-SPEED-JSON-STABLE` / `brightace-json-v66`.
- The existing production Web App must be edited and deployed as a **new version of the SAME Web App deployment** so its existing `/exec` URL remains unchanged.
- Do not create a second production Web App URL.
- After deployment, verify the existing `/exec?action=health` and `/exec?action=version` responses are JSON and contain the V66 build identifier.
- The frontend also detects an HTML response and gives a deployment-specific error instead of attempting to parse it as JSON.

## Removed from package
- Removed the nested `BrightAce-Academy-V63-PRODUCTION-HARDENING-SECURITY-QA(1).zip` archive from this V66 package. Its contents were already represented in the working V66 source/report set and the nested ZIP only inflated the distribution package.
