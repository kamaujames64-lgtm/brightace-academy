# BrightAce production Apps Script endpoint

The frontend production endpoint is:

https://script.google.com/macros/s/AKfycbzwomGZZZwzKCCAEVhFo9OBTkgz_aKNA6DyO7cIYh_cN8g90e-8dCPl18Bs5XxaH13u/exec

All BrightAce frontend references in this package have been normalized to this exact `/exec` URL.

## Deployment requirement

The URL itself is not a source-code deployment. The Apps Script project containing `backend/Code.gs` must be deployed as the web app used by this `/exec` deployment, with the latest backend version selected.

The current environment cannot directly authenticate to the user's private Google Apps Script deployment, so live `/exec` behavior must be verified from the user's browser after deployment.


This same endpoint is used by the updated statement registration and verification workflow. Deploy the matching backend Code.gs version to this /exec deployment.


## API /exec repair package
This package also includes `backend/Code.gs` JSON error-boundary hardening, `backend/appsscript.json`, and a centralized `js/brightace-api-config.js`. These changes do not alter the visual design. The deployed Apps Script Web App must still be updated to the latest source version before `/exec` can return the repaired JSON response.
