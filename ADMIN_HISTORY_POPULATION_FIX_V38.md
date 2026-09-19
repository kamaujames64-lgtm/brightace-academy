# BrightAce Academy — Admin History Population Fix V38

Base: V37 RETURNING USER CHAT.

## Fixed
- Admin History now uses explicit server-side Pending / Completed / Rejected lifecycle buckets.
- Fresh History reads bypass the short-lived history cache.
- Older CONVERSATIONS rows are classified using assignment status plus completedAt/rejectedAt/rejectionReason.
- Closed rows without an active lifecycle state are no longer incorrectly placed in Pending / Active Work.
- Frontend has a defensive fallback for older backend deployments.
- Existing History layout, buttons, navigation, and unrelated functionality are unchanged.

## Deployment
Deploy the updated `backend/Code.gs` as a new version of the existing Google Apps Script Web App, keeping the same `/exec` URL.
