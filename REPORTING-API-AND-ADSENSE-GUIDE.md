# BrightAce reporting, Google APIs and AdSense rollout

## What this release adds
- Uses existing Apps Script `adminResourceAnalytics` for resource sales, net revenue, access and download reporting.
- Uses existing `adminObservability` for API build, delivery queue and recent operational failures.
- Adds a read-only Admin Reports page that uses these existing server-authorized reports. Google Sheets remains the operational record.
- AdSense is marked **not connected** until BrightAce has an approved AdSense account and the account/API configuration. No earnings are invented.

## Recommended Google APIs
1. **Google Sheets API / existing Apps Script Spreadsheet service**: optimize hot paths with batch reads/writes; do not replace working spreadsheet logic indiscriminately.
2. **Google Drive API / DriveApp**: inspect file metadata, access permissions, and resource links. Display changes do not automatically repair inaccessible Drive files.
3. **Google Analytics Data API**: optional website usage reports once a GA4 property is configured.
4. **AdSense Management API**: optional earnings reports after account approval and server-side configuration.
5. **Python on Render**: bounded processing and optional shared Redis cache from the included performance-engine foundation. It remains separate from client authentication and payment authority.

## AdSense implementation steps
1. Obtain AdSense approval for the actual BrightAce site.
2. Add the required AdSense site code through the approved setup; never put private credentials in frontend files.
3. In the Apps Script project's linked Google Cloud project, enable the AdSense Management API. Add its Apps Script advanced service if available for the project's API version.
4. Authorize a dedicated server-side admin-only reporting function with an account that can access the publisher account. Keep identifiers/configuration in Script Properties; never expose them to browser code.
5. Test report date ranges, compare figures with the AdSense dashboard, then enable live earnings display.
6. Earnings are not guaranteed. Follow AdSense policy and never click your own ads or encourage users to click them.

## Security and performance notes
- Client portal HTML and authentication scripts are network-only in the service worker so stale cached shells cannot display protected navigation before session validation. Public static assets remain cacheable.
- Apps Script chat-message reads no longer create a client session from `clientAccessToken` alone; a valid server-issued session token is required. Old browser state without one must complete WhatsApp verification again.
- Cache is an optimization, not the source of truth for access decisions, payments, or session validity.
- The Python engine is not proof of 3,000-user capacity. Run staged load tests, measure latency/error rates, configure Redis if needed, then plan production scaling.
- No deployment has been performed. Test website files on a branch and update the existing Apps Script project in a reviewed test window before production.
