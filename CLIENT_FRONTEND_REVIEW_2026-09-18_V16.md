# BrightAce Academy — Client Front-End Review V16

## Scope
Focused client-side presentation/usability pass. Existing backend architecture, admin/tutor workflows, security model, navigation destinations and unrelated functionality were preserved.

## Changes
- Refined client dashboard visual hierarchy, spacing, cards, request rows and mobile behavior.
- Added explicit OPEN REQUEST controls while preserving request-card click behavior.
- Moved client feedback to the individual request detail so feedback is explicitly associated with that request.
- Added a request-specific 1–5 rating selector alongside the request-specific feedback text.
- Removed the duplicate dashboard-wide feedback box that could imply feedback was not tied to a specific request.
- Removed duplicate inline final-work feedback controls from the general tutor-work list; request details remain the single place for request-specific feedback.
- Kept final-work feedback/rating submission supported through the existing request feedback endpoint.
- Refined the dashboard tutorial to a cleaner five-step, mobile-friendly guide with a progress indicator and shorter client-friendly copy.
- Bumped onboarding markers to V4 so the improved tutorial is shown as a fresh guide, including for the designated test client number.
- Improved dashboard session restoration: if an existing access token is stale, the dashboard makes one authenticated bootstrap/recovery attempt before sending the client back to verification. The 30-minute inactivity rule remains enforced.
- Dashboard conversation identifiers now consistently accept the stored conversation/request ID fallback.

## Validation
- Client dashboard executable JavaScript syntax: PASS
- Client chat JavaScript syntax: PASS
- ZIP integrity: PASS
