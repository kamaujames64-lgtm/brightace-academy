# BrightAce Python website integration patch

Prepared from the fresh GitHub ZIP uploaded on 2026-10-17.

## Files changed/added
- Added `backend/BA_Python.gs`: server-side proxy; the Render secret is never sent to the browser.
- Updated `backend/Code.gs`: routes `adminPythonJob` to the proxy.
- Updated `backend/BA_Security.gs`: adds `adminPythonJob` to the POST allowlist.
- Updated `backend/BA_Validation.gs`: bounds the feature field.
- Updated `js/admin-navigation.js`: adds Python Tools to SYSTEM navigation.
- Added `pages/admin-python.html`: super-admin-only text statistics interface.

## Before production
1. Apply these files to the GitHub repository, preserving all other files.
2. Copy the new `backend/BA_Python.gs` into the Apps Script project as `BA_Python.gs`.
3. Update the three existing Apps Script files (`Code.gs`, `BA_Security.gs`, `BA_Validation.gs`) with the corresponding changes from this package, then save and deploy a new web-app version.
4. Confirm Script Properties `PYTHON_SERVICE_URL` and `PYTHON_SERVICE_API_KEY` match Render's `BRIGHTACE_SERVICE_API_KEY`. Never put the service key in any frontend file.
5. Test the page while signed in as the super administrator and regression-test existing workflows.

This package is prepared but has not been pushed to GitHub or deployed to Apps Script. The only enabled Python feature is the verified `text_stats` smoke test.
