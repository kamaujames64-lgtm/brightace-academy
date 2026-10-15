# Apps Script proxy integration plan (review before applying)

The static GitHub Pages client must not receive `BRIGHTACE_SERVICE_API_KEY`. Keep that secret in Apps Script Script Properties and the Python host only.

## Required Script Properties

- `PYTHON_SERVICE_URL`: HTTPS base URL for the deployed Python API.
- `PYTHON_SERVICE_API_KEY`: same random secret configured on the Python host.

## Safe routing requirements

Add a dedicated, narrowly scoped action to the existing `doPost(e)` routing table only after the allowed users and features are agreed. Before calling the Python API:

1. Validate the existing BrightAce session/admin identity with the existing helpers.
2. Authorize the specific feature for that identity; do not rely on CORS or a hidden button.
3. Accept only an allowlist of feature names and validate each feature's input shape and size.
4. Build the Python URL from `PYTHON_SERVICE_URL` Script Property only; never accept a URL from the browser.
5. Send `X-BrightAce-Service-Key` from Script Properties, JSON content type, and bounded input to `/api/v1/jobs` using `UrlFetchApp.fetch` with `muteHttpExceptions: true`.
6. Map upstream HTTP failures to a normalized error response. Do not return stack traces or secrets.
7. Log only action, status, duration, and a request ID; do not log user files, document text, or credentials.

Do not deploy a generic public proxy. This plan intentionally does not change `backend/Code.gs` because adding a route without confirming the intended user roles could bypass the website's existing authorization boundaries.
