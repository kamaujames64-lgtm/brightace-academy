"""BrightAce Academy's separate, progressively extensible Python API."""
from __future__ import annotations

import hmac
import os
from typing import Any
import asyncio
from contextlib import asynccontextmanager
from starlette.concurrency import run_in_threadpool
from uuid import uuid4

from fastapi import Depends, FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field

from app.features import FEATURES, run_feature
from app.performance_engine import cache_backend_status, close_cache, get_cache_json, set_cache_json

APP_NAME = os.getenv("APP_NAME", "BrightAce Python Service")
APP_VERSION = "0.3.0"
MAX_INFLIGHT_JOBS = max(1, int(os.getenv("MAX_INFLIGHT_JOBS", "100")))
JOB_ADMISSION_TIMEOUT_SECONDS = max(0.05, float(os.getenv("JOB_ADMISSION_TIMEOUT_SECONDS", "0.25")))
_job_slots = asyncio.Semaphore(MAX_INFLIGHT_JOBS)
raw_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5500,http://127.0.0.1:5500,http://localhost:8000",
)
ALLOWED_ORIGINS = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]
MAX_BODY_BYTES = int(os.getenv("MAX_BODY_BYTES", str(1 * 1024 * 1024)))

@asynccontextmanager
async def lifespan(_: FastAPI):
    yield
    await close_cache()


app = FastAPI(
    title=APP_NAME,
    version=APP_VERSION,
    description=(
        "BrightAce Python performance engine. Existing Google Apps Script workflows "
        "remain the system of record. Shared caching is optional and enabled only when "
        "REDIS_URL is configured. Notebook-specific features require review."
    ),
    lifespan=lifespan,
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


class CacheRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    value: Any
    ttl_seconds: int = Field(default=30, ge=1, le=3600)


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


@app.get("/api/v1/engine/status", dependencies=[Depends(require_service_key)])
async def engine_status() -> dict[str, Any]:
    """Private operational status; does not expose secrets or customer data."""
    cache = await cache_backend_status()
    return {
        "ok": True,
        "engine_version": APP_VERSION,
        "cache": cache,
        "max_inflight_jobs_per_instance": MAX_INFLIGHT_JOBS,
        "queueing": "not configured; excess synchronous jobs are rejected rather than queued",
        "database": "not configured; existing Apps Script/Sheets remain authoritative",
    }


@app.get("/api/v1/cache/{namespace}/{key}", dependencies=[Depends(require_service_key)])
async def read_cache(namespace: str, key: str) -> dict[str, Any]:
    """Internal cache primitive. Use only for non-authoritative derived data."""
    if not namespace.replace("-", "").replace("_", "").isalnum() or len(namespace) > 48:
        raise HTTPException(status_code=400, detail="Invalid cache namespace.")
    if not key or len(key) > 160 or any(ord(c) < 33 for c in key):
        raise HTTPException(status_code=400, detail="Invalid cache key.")
    value = await get_cache_json(namespace, key)
    return {"ok": True, "hit": value is not None, "value": value}


@app.put("/api/v1/cache/{namespace}/{key}", dependencies=[Depends(require_service_key)])
async def write_cache(namespace: str, key: str, body: CacheRequest) -> dict[str, Any]:
    """Internal cache primitive. Never store credentials or raw private records here."""
    if not namespace.replace("-", "").replace("_", "").isalnum() or len(namespace) > 48:
        raise HTTPException(status_code=400, detail="Invalid cache namespace.")
    if not key or len(key) > 160 or any(ord(c) < 33 for c in key):
        raise HTTPException(status_code=400, detail="Invalid cache key.")
    stored = await set_cache_json(namespace, key, body.value, body.ttl_seconds)
    if not stored:
        raise HTTPException(status_code=503, detail="Shared cache is not configured or unavailable.")
    return {"ok": True, "stored": True, "ttl_seconds": body.ttl_seconds}


@app.post("/api/v1/jobs", dependencies=[Depends(require_service_key)])
async def run_job(job: JobRequest) -> dict[str, Any]:
    """Execute a registered, bounded feature. Unknown features never execute arbitrary code."""
    job_id = str(uuid4())
    try:
        await asyncio.wait_for(_job_slots.acquire(), timeout=JOB_ADMISSION_TIMEOUT_SECONDS)
    except asyncio.TimeoutError:
        raise HTTPException(status_code=429, detail="Python service is busy; retry with backoff.")
    try:
        result = await run_in_threadpool(run_feature, job.feature, job.input)
    except KeyError:
        raise HTTPException(
            status_code=404,
            detail={"message": "Feature is not registered.", "available_features": sorted(FEATURES)},
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    finally:
        _job_slots.release()
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

