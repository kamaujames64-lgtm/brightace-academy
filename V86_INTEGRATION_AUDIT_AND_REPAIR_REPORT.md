# BrightAce Academy V86 — Integration and UI Audit / Repair Report

**Audit date:** 2026-10-13  
**Scope:** Uploaded source ZIP; static inspection and local automated checks.  
**Production status:** Source repairs are complete and local checks pass. Live Google Apps Script, Google Sheets, Google Drive permissions/folders, payment-provider callbacks, and browser behavior cannot be authenticated or verified from this ZIP alone.

## Repairs made

1. **Conflicting Apps Script endpoint documentation**
   - Found two different production `/exec` URLs: the centralized frontend configuration and the majority of frontend pages used the `AKfycbzs...` deployment, while `PRODUCTION_EXEC_ENDPOINT.md`, `README.md`, and the statement update note named `AKfycbzwom...`.
   - Normalized those conflicting documentation references to the URL already used by `js/brightace-api-config.js` and the majority of runtime callers.
   - **Important:** this makes source and docs consistent; it does not prove that this deployment ID is live or has the latest backend deployed. Confirm the deployed Apps Script version before production use.

2. **Broken frontend asset reference**
   - `index.html` referenced `js/brightace-currency.js`, but no such file exists in the archive and no matching frontend implementation was found.
   - Removed the dangling script tag and left a comment. This prevents a guaranteed 404. If a homepage currency converter was intended, its actual UI/logic still needs to be supplied or implemented; the server-side `BA_Currency.gs` module remains present.

3. **Upload MIME-policy gap**
   - The resource upload MIME gate allowed active web/executable MIME types such as JavaScript through the first policy check, relying on later checks to reject them.
   - Added an explicit deny-list at the MIME-policy layer for JavaScript/ecmascript, HTML, common executable MIME types, and SVG.
   - Restricted private client deliveries to images and document/text MIME families, excluding audio/video payloads to match the existing private-delivery contract and test expectations. Existing signature/extension/threat checks remain in place.

4. **Button sizing**
   - Added a shared compact control sizing override to `css/style.css`, `css/client-portal.css`, `css/admin-chat.css`, and `css/admin-navigation.css`.
   - Standard action buttons (submit/open/view/save/download and similar `.btn`/button controls) now target approximately 34px minimum height, compact horizontal padding, 12–13px text, and automatic width instead of stretching to oversized full-width controls.
   - Icon-only/menu/chat controls retain compact square sizing. Responsive sizing is included for small screens.

## Integration findings

- Frontend API configuration is centralized in `js/brightace-api-config.js`; runtime pages/scripts mostly use the same configured endpoint or the same literal URL.
- Apps Script source is modular under `backend/*.gs`, with `backend/Code.gs` acting as the entry/dispatch layer. `backend/appsscript.json` configures the web app for anonymous access, so every sensitive action must continue to enforce authorization in server code.
- Resource management code references the canonical Sheets schema and Drive upload/access workflow. Existing resource tests cover upload authorization, public/private Drive sharing rules, request quotation/payment transitions, idempotent payment handling, and ownership checks.
- The repository contains deployment configuration templates rather than verified live Sheet/Drive IDs. Those IDs and Script Properties are intentionally environment-specific and cannot be validated from this archive.
- Statuses should remain workflow-specific and match server transitions. Resource request statuses already include states such as `Submitted`, `Under review`, `Awaiting clarification`, `In preparation`, and `Delivered`; payment/verification and messaging have their own distinct lifecycle states. I did not force every workflow into one shared status enum because doing so could break existing server-side transition rules.

## Verification performed

- **26/26** existing V86 resource contract/unit checks pass after repairs.
- All `.js` files in `js/` and `tools/` passed `node --check`.
- All `.gs` files passed Node syntax parsing (syntax-only; not a Google Apps Script runtime test).
- Static local `href`/`src` scan: **0 unresolved literal local references** after removing the missing currency script reference. Dynamic template URLs were excluded because they are constructed at runtime.
- No live service test was performed against Google Sheets, Drive, Apps Script, or Paystack.

## Remaining deployment checklist

1. Deploy the updated `backend/*.gs` sources to the Apps Script deployment matching the canonical endpoint.
2. In Apps Script Project Settings, verify required Script Properties exist and point to the correct spreadsheet and Drive folders; ensure private delivery and paid-resource folders are not publicly shared.
3. Verify expected Sheets tabs/headers using the backend schema initialization/health checks.
4. In a production browser, test one flow each for sign-in/verification, client request submission, admin review/status update, Drive upload/view/download, payment initiation and callback verification, and tutor/client messaging.
5. Check browser console/network logs for CORS, authorization, missing assets, and `/exec` JSON errors.
6. Review the compact button sizing on desktop and mobile pages with real content; CSS-only static checks cannot confirm every page's rendered layout.
