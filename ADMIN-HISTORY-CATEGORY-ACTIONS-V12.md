# BrightAce Admin History Category Actions — V12

## Changes
- Removed the page-wide DELETE SELECTED HISTORY action and individual row-level Restore/Delete buttons.
- Added category-scoped Select all, Restore selected, and Delete selected controls to Pending / Active, Completed, and Rejected work.
- Selection is limited to the category where the controls are used; each action reports selected/total counts.
- Restore sends each selected conversation through the existing `adminRestoreWork` endpoint and refreshes history afterward.
- Delete requires the existing confirmation plus typing `DELETE`, then calls `adminDeleteWorkHistory` for each selected request. The endpoint still requires Super Admin authorization and preserves financial payment records.
- Updated the backend delete guard so selected requests from all three categories can be deleted, matching the requested category actions. This is destructive and removes the request/chat history and associated schedule entries, but not financial payment records.
- Improved layout with responsive auto-fit category cards, scroll areas sized to the viewport, and clearer request cards.
- Bumped the service-worker cache namespace to V12.

## Validation
- Inline JavaScript syntax check: passed.
- Backend JavaScript syntax check: passed with Node.js after wrapping Apps Script source for parsing.
- Live Google Apps Script deployment and production data mutations were not executed from this environment; deploy the included backend before testing actions.
