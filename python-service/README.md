# BrightAce Academy Python integration

This service is an additive Python platform. It does not replace the existing GitHub Pages frontend or Google Apps Script backend. Apps Script remains the system of record for existing BrightAce workflows; the Python service handles separately deployed, explicitly registered compute features.

## Implemented in this starter

- `GET /health`: public, non-sensitive health check.
- `GET /api/v1/capabilities`: reports features actually registered.
- `POST /api/v1/jobs`: protected by a server-side `BRIGHTACE_SERVICE_API_KEY` and only dispatches registered features.
- `text_stats`: harmless end-to-end smoke test for the protected job pipeline.
- Optional Streamlit operator/test UI that calls the API server-side.
- Request-body size limit, input validation, explicit CORS origins, Docker and Render templates.

The actual Colab notebook has not been supplied. No AI, document, image, or video functionality is claimed. Notebook-derived features must be reviewed, extracted into testable functions, registered in `app/features.py`, and covered by tests before being enabled.

## Local setup (Python 3.11+)

From `python-service/`:

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
```

Edit `.env` and replace `BRIGHTACE_SERVICE_API_KEY` with a long random secret. Never commit `.env` or expose the key to website JavaScript. Start the API:

```powershell
uvicorn app.main:app --reload --port 8000
```

Check `http://127.0.0.1:8000/health`, `http://127.0.0.1:8000/api/v1/capabilities`, and `http://127.0.0.1:8000/docs`.

In another terminal, from `python-service/`:

```powershell
$env:BRIGHTACE_API_URL="http://127.0.0.1:8000"
$env:BRIGHTACE_SERVICE_API_KEY="the-same-local-secret"
streamlit run streamlit_app/app.py
```

Run tests:

```powershell
python -m pytest -q
```

## GitHub Pages + Apps Script architecture

GitHub Pages is static hosting and must not contain API secrets. Do not call `/api/v1/jobs` directly from public browser JavaScript with the service key. For production, use an authenticated Apps Script server-side proxy:

1. Set Script Properties `PYTHON_SERVICE_URL` and `PYTHON_SERVICE_API_KEY` in the Apps Script project. Never put the key in Git or HTML/JS.
2. Add a narrowly scoped action to the existing Apps Script `doPost` router only after deciding which existing BrightAce user roles may invoke each feature. Reuse existing session/admin authorization helpers; do not create a public unauthenticated proxy.
3. The proxy should validate the user and allowed feature/input, call `UrlFetchApp.fetch(PYTHON_SERVICE_URL + '/api/v1/jobs', ...)`, set `X-BrightAce-Service-Key` from Script Properties, enforce a short timeout and bounded payload, and return a normalized JSON result. Never pass arbitrary URLs, code, or arbitrary feature names from the browser.
4. Add an action-specific Apps Script security test and regression-test existing chat, resources, payment, login, and admin routes before deployment.
5. Set `ALLOWED_ORIGINS` on the Python host to the exact website origin(s) only if browsers need to call public endpoints. CORS is not authentication and the service key should stay server-side.

This starter intentionally does not modify `backend/Code.gs` or change existing Apps Script routes. The correct proxy action depends on the current permission and session model and must be added and tested as a separate, reviewed change.

## Deploy API (Render example)

1. Push the repository to a private GitHub repository if it contains any internal configuration or project material.
2. Create a Render Web Service from the repository using the included `python-service/render.yaml` or the Dockerfile.
3. Configure `BRIGHTACE_SERVICE_API_KEY` as a secret environment variable and set `ALLOWED_ORIGINS` to exact allowed origins. Do not sync secret values to source control.
4. Deploy and verify `/health`, `/api/v1/capabilities`, unauthorized job rejection, authorized smoke test, logs, and resource usage.
5. Deploy Streamlit separately only if an operator-facing standalone UI is required; set its `BRIGHTACE_API_URL` and secret environment variables server-side.
6. Only after these checks, wire the Apps Script proxy to the deployed API URL.

## Production hardening still required

- Add the real notebook and dependency/license review.
- Add authentication and per-role feature authorization at the Apps Script proxy.
- Add durable job queueing if tasks are long-running; the current endpoint is synchronous.
- Add feature-specific upload validation, storage lifecycle/cleanup, malware/archive controls, rate limits, quotas, and monitoring if file processing is added.
- Add request IDs/logging without recording private payloads, plus timeouts and cost controls.
- Test with staging data before production; no live service has been deployed by this package.
