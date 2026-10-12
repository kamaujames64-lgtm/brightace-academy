# BrightAce Academy V68 — Admin Navigation Dropdown Redesign

## Changes
- Replaced the permanently visible admin page links with exactly four collapsible groups: OVERVIEW, PEOPLE & DELIVERY, FINANCE & RECORDS, and SYSTEM.
- Each group opens a dropdown containing the existing pages assigned to that group.
- Preserved the existing admin page destinations, page content, authentication, and API behavior.
- Kept the existing inherited website font stack and tuned labels around 10–11px, submenu links at 12px, with the BrightAce navy/blue palette and gold active-section marker.
- Added active-page highlighting, current-group indication, click-away closing, Escape-key closing, keyboard focus indicators, and responsive behavior. Only one group can remain open at a time.
- Updated navigation asset cache versions to V68.

## Group mapping
- OVERVIEW: Dashboard, Client Admissions, Work Assignments
- PEOPLE & DELIVERY: Tutors, Scheduling, Quality Control, Admin Team
- FINANCE & RECORDS: Payments, Tutor Earnings, History
- SYSTEM: Resources, System Health, Recovery, Production QA, My Profile

## Validation
- Source files and ZIP integrity checked after packaging.
- JavaScript syntax check performed with Node.js when available.
- This is a source-level check; browser interaction and live production behavior still need verification in the deployed site.
