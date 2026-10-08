# BrightAce V66 — Phone Country Picker Final Fix — 2026-10-04

Fixed the phone country selector and local-number input behavior.

## Fixes
- Country selector now stores the ISO country code as its unique value. This prevents countries sharing a dial code (especially United States/Canada and other +1 countries) from selecting the wrong country.
- The selected country is rendered from the ISO code and shows its bundled flag plus dial code.
- The visible number field contains only the local/national number. The country dial code is never inserted into that visible field.
- A hidden companion field carries the complete international number for form submission.
- The country popup is portaled to `document.body` and positioned with `position: fixed`, a high z-index, viewport collision handling, and scroll/resize repositioning. This prevents parent cards, forms, or overflow containers from clipping the country list.
- Search and selected-state highlighting continue to work.

## Changed files
- `js/brightace-phone.js`

## Validation
- JavaScript syntax check passed.
- ZIP integrity check passed.
