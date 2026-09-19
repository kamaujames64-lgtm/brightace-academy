# BrightAce Academy — Statement PDF Update — 2026-09-18

This package is based on the latest production-EXEC-endpoint package.

## Included changes
- Owner statement title now reads **BrightAce Academy Transaction Statement** rather than Owner / Main Admin as the statement subject.
- Owner statement identifies the administrator separately.
- Client statements show client name, email when recorded, and phone.
- Tutor statements show tutor name, email when recorded, phone, and tutor ID.
- All three statement types support an optional From/To date range. Blank dates mean all recorded transactions.
- Statements are generated from a fresh backend statement-registration request instead of relying on dashboard-cached payment data.
- A clear no-transactions row is shown when a selected period contains no records.
- Each generated statement receives a unique `BA-STMT-...` reference.
- Each generated statement receives an SHA-256 integrity code.
- A BrightAce digital-verification stamp and QR code are placed on the PDF when the QR service is reachable.
- The QR opens the BrightAce public statement verification page.
- The backend records issued statement references in `STATEMENT_REGISTRY`, allowing the reference to be checked later.
- Tutor directory now accepts/stores tutor email for new tutor records. Existing tutor records will show “Not recorded” until an email is stored.
- The requested production Apps Script `/exec` URL remains unchanged and is already embedded throughout the package.

## Important deployment step
The ZIP changes both frontend files and `backend/Code.gs`. The Apps Script backend must be saved and deployed as a new version to the production `/exec` deployment before the new statement registration, date-range filtering, and verification features can work.

Production endpoint:
`https://script.google.com/macros/s/AKfycbzwomGZZZwzKCCAEVhFo9OBTkgz_aKNA6DyO7cIYh_cN8g90e-8dCPl18Bs5XxaH13u/exec`
