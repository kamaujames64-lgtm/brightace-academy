# BrightAce V66 — Phone Country Auto-Switch Fix

## Problem
After a user manually selected Kenya (+254), entering a local Kenyan mobile number such as `725010628` could cause the country picker to jump to another country while typing. The previous input handler attempted to infer a country from every keystroke. Because Kenya numbers commonly begin with `7`, the partial/local value could be mistaken for a country using `+7`.

## Fix
- Country inference now happens only for an initial/pasted value that explicitly starts with `+`.
- Once the user selects a country from the picker, that country is locked while typing the local number.
- The visible number field remains local/national only; the selected dial code is never inserted into the visible field.
- The hidden submitted value uses the selected country's dial code plus the local number.
- Fixed the hidden-value builder to read the selected dial code from the option's `data-dial` attribute rather than the ISO-code option value.
- The body-level popup outside-click handler now treats the popup itself as inside, so choosing an option is not interrupted after the menu is moved to `document.body`.

## Kenya example
Selected country: `Kenya +254`

Typed local number: `725 010 628`

Displayed result remains:

`Kenya +254 | 725 010 628`

It must **not** change to `+7` or another country during entry.

## Changed files
- `js/brightace-phone.js`
- `README.md`
- `PHONE_COUNTRY_LOCAL_NUMBER_LOCK_FIX_2026-10-04.md`

No backend `.gs` files were changed for this fix.
