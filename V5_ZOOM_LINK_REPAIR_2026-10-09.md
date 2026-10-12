# BrightAce V66 — V5 Zoom Link Repair — 2026-10-09

## Problem
The backend validator only accepted `zoom.us` or `www.zoom.us`. Normal Zoom meeting links are frequently hosted on regional Zoom subdomains such as `https://us02web.zoom.us/j/...`, so valid Zoom links were rejected with the message that a valid Zoom meeting link was required.

## Fix
`backend/Code.gs` now uses `isValidZoomMeetingLink_()` for both online-session confirmation paths. It accepts Zoom regional subdomains under `zoom.us` / `zoom.com`, including examples such as:
- `https://zoom.us/j/...`
- `https://www.zoom.us/j/...`
- `https://us02web.zoom.us/j/...`
- `https://us06web.zoom.us/j/...`
- `https://zoom.us/my/...`

The requirement that every confirmed online tutoring session has a Zoom meeting URL remains in place; the validation is simply no longer too strict.

## Changed files
- `backend/Code.gs`
- `V5_ZOOM_LINK_REPAIR_2026-10-09.md`
