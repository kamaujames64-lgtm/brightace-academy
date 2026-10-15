"""BrightAce Academy's separate, progressively extensible Python API."""
from __future__ import annotations

import hmac
import os
from typing import Any
from uuid import uuid4

from fastapi import Depends, FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field

from app.features import FEATURES, run_feature

APP_NAME = os.getenv("APP_NAME", "BrightAce Python Service")
APP_VERSION = "0.2.0"
raw_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5500,http://127.0.0.1:5500,http://localhost:8000",
)
ALLOWED_ORIGINS = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]
MAX_BODY_BYTES = int(os.getenv("MAX_BODY_BYTES", str(1 * 1024 * 1024)))

app = FastAPI(
    title=APP_NAME,
    version=APP_VERSION,
    description=(
        "BrightAce's separate Python service. Existing Google Apps Script workflows "
        "remain the system of record. Notebook-specific features are added only after review."
    ),
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "X-BrightAce-Service-Key"],
)


class CapabilityResponse(BaseModel):
    service: str
    status: str
    notebook_connected: bool
    enabled_features: list[str]
    protected_execution: bool
    next_step: str


class JobRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    feature: str = Field(min_length=1, max_length=80, pattern=r"^[a-z][a-z0-9_]*$")
    input: dict[str, Any] = Field(default_factory=dict)


@app.middleware("http")
async def enforce_body_limit(request: Request, call_next):
    """Reject oversized requests before parsing JSON where Content-Length is present."""
    raw_length = request.headers.get("content-length")
    if raw_length:
        try:
            if int(raw_length) > MAX_BODY_BYTES:
                return __import__("starlette.responses", fromlist=["JSONResponse"]).JSONResponse(
                    status_code=413,
                    content={"detail": f"Request body exceeds {MAX_BODY_BYTES} bytes."},
                )
        except ValueError:
            return __import__("starlette.responses", fromlist=["JSONResponse"]).JSONResponse(
                status_code=400, content={"detail": "Invalid Content-Length header."}
            )
    return await call_next(request)


def require_service_key(x_brightace_service_key: str | None = Header(default=None)) -> None:
    """Protect execution endpoints; keep the key server-side (Apps Script properties)."""
    expected = os.getenv("BRIGHTACE_SERVICE_API_KEY", "").strip()
    if not expected:
        raise HTTPException(
            status_code=503,
            detail="Python execution is disabled until BRIGHTACE_SERVICE_API_KEY is configured.",
        )
    if not x_brightace_service_key or not hmac.compare_digest(x_brightace_service_key, expected):
        raise HTTPException(status_code=401, detail="Valid service credentials are required.")


@app.get("/health")
def health() -> dict[str, Any]:
    """Public, non-sensitive hosting health check."""
    return {"ok": True, "service": APP_NAME, "version": APP_VERSION}


@app.get("/api/v1/capabilities", response_model=CapabilityResponse)
def capabilities() -> CapabilityResponse:
    """Describe implemented features, not aspirational features."""
    return CapabilityResponse(
        service=APP_NAME,
        status="starter_ready",
        notebook_connected=False,
        enabled_features=["health_check", "capability_discovery", *sorted(FEATURES)],
        protected_execution=bool(os.getenv("BRIGHTACE_SERVICE_API_KEY", "").strip()),
        next_step="Review the notebook and add its functions as validated features.",
    )


@app.post("/api/v1/jobs", dependencies=[Depends(require_service_key)])
def run_job(job: JobRequest) -> dict[str, Any]:
    """Execute a registered, bounded feature. Unknown features never execute arbitrary code."""
    job_id = str(uuid4())
    try:
        result = run_feature(job.feature, job.input)
    except KeyError:
        raise HTTPException(
            status_code=404,
            detail={"message": "Feature is not registered.", "available_features": sorted(FEATURES)},
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    return {"ok": True, "job_id": job_id, "feature": job.feature, "result": result}


@app.post("/api/v1/process", deprecated=True)
def process_placeholder() -> dict[str, Any]:
    """Compatibility response for the initial scaffold; no notebook logic is implied."""
    raise HTTPException(
        status_code=409,
        detail=(
            "Use /api/v1/jobs with a registered feature. The actual Colab notebook has not "
            "been supplied, so notebook-specific processing is not yet available."
        ),
    )
