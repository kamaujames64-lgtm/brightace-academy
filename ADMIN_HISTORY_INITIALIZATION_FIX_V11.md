# BrightAce V11 — Admin History Initialization Repair — 2026-10-11

## Root cause
`pages/admin-history.html` closed `render()` immediately after binding the Restore button handlers. The subsequent Delete History handler registration referenced `type` and `box` outside their scope. This threw a `ReferenceError` while the script was evaluating, before `bootHistory()` could run, so the page never requested its history data and all three sections stayed on Loading.

## Changes
- Kept Restore and Delete History event binding inside `render(box, rows, type)`, where the required variables are in scope.
- Preserved existing confirmation prompts, backend delete/restore actions, financial-record preservation messaging, and selection rules.
- Bumped the service-worker cache namespace to `brightace-v66-runtime-20261011-history-v11`.
- Updated the backend build marker to `2026-10-11-V66-ADMIN-HISTORY-INITIALIZATION-FIX-V11`.

## Validation
- Extracted the inline JavaScript from `pages/admin-history.html` and ran `node --check`; syntax check passed.
- This is a static code repair. Live population still depends on deploying the included backend to the existing Apps Script project and the configured production spreadsheet being accessible.
