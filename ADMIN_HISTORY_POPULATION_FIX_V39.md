# BrightAce Academy — Admin History Population Fix V39

## Problem fixed
Admin History remained on “Loading…” for Pending / Active, Completed, and Rejected work, and some callers reported `Unknown GET action`.

## Changes
- Repaired `adminListWorkHistory_` to read only the `CONVERSATIONS` sheet.
- Avoided a potentially oversized `getDataRange()` history matrix.
- Finds the last real conversation row using only the `conversationId` column.
- Reads CONVERSATIONS in bounded 250-row chunks and classifies each row independently.
- A malformed row is skipped instead of preventing all History results from loading.
- Returns explicit `pending`, `completed`, and `rejected` buckets.
- Added read-only GET aliases:
  - `adminListWorkHistory`
  - `adminHistory`
  - `adminWorkHistory`
  - `adminListHistory`
  - `history`
- Added GET support for `adminListTutorEarningsDetails`, which had a frontend GET fallback.
- History frontend now gives the API up to 30 seconds and tries the compatible GET aliases after POST failure.
- Existing visual design, controls, navigation, deletion/restore behavior, and unrelated application features are preserved.

## Deployment
Deploy this `backend/Code.gs` as a new version of the existing production Apps Script Web App. Keep the same `/exec` URL and use Execute as: Me; Who has access: Anyone.
