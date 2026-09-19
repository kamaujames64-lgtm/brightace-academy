# BrightAce Academy V46 — Admin History Fast Path + Scalability

## Purpose
V46 is based on the V45 deployment-guard / V44 statement / V43 scalability package. It specifically addresses the Admin History page loading problem while preserving the existing BrightAce client, tutor, admin, payment, statement, and chat workflows.

## Admin History fixes
- Added `BA_History.gs`.
- Replaced the V45 history cold-path `TextFinder(".+").findPrevious()` discovery with bounded `getLastRow()` + chunked reads.
- Removed unnecessary `rowConversation_()` hydration from History. The response now contains only fields required to display and manage history.
- Preserves client name, phone/email, tutor, tutor phone, admin assignment, request description, budget, approved amount, currencies, tutor payout, BrightAce share, deadline, request/activity dates, lifecycle status, completion/rejection details.
- Handles legacy status spellings and completion/rejection timestamps.
- Sorts newest activity first.
- A malformed row is skipped rather than breaking the entire History response.
- Added a cache layer that uses a compact single value when possible and automatically splits large histories into cache pages when necessary.
- Normal page load uses the fast cache; the Refresh button explicitly requests fresh data.
- Retry explicitly requests fresh data.
- Cache remains an optimization only; a cache failure cannot prevent the live database read.

## Deployment
- Build: `2026-09-19-V46-HISTORY-FASTPATH-COMPREHENSIVE-STATEMENT-SCALABILITY`
- `/exec?action=health` and `/exec?action=version` identify V46.
- `BA_Deployment.gs` now reports `brightace-json-v46`.

## Preserved
- V44 comprehensive admin statement transaction logic.
- V43 data/cache/scalability layer.
- V45 deployment consistency guard.
- Existing UI and navigation; no redesign.

## Validation
- All backend `.gs` files checked for JavaScript syntax after normalization.
- No duplicate top-level function names.
- Admin History HTML checked for script syntax.
- Statement PDF JavaScript retained and checked.
- No claim is made that live production /exec was load-tested in this environment.

## Deployment requirement
Upload all V46 backend `.gs` files into the same Apps Script project and deploy a new version of the existing Web App. Keep the existing `/exec` URL. If the production endpoint continues returning the V45 build after deployment, the Apps Script Web App deployment is still pointing at an older version.
