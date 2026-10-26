"""Optional shared Redis cache for BrightAce's Python service.

This module intentionally does not fall back to per-process memory: local memory
caches become inconsistent when Render runs multiple instances. When REDIS_URL is
absent or Redis is unavailable, cache operations fail closed and the core API still
runs. Do not cache authentication decisions, session tokens, payment state, or raw
private client/tutor records here.
"""
from __future__ import annotations

import json
import os
from typing import Any

_redis = None
_redis_init_attempted = False


def _client():
    global _redis, _redis_init_attempted
    if _redis_init_attempted:
        return _redis
    _redis_init_attempted = True
    url = os.getenv("REDIS_URL", "").strip()
    if not url:
        return None
    try:
        from redis.asyncio import Redis
        _redis = Redis.from_url(
            url,
            decode_responses=True,
            socket_connect_timeout=1.5,
            socket_timeout=1.5,
            health_check_interval=30,
            max_connections=max(10, int(os.getenv("REDIS_MAX_CONNECTIONS", "100"))),
        )
    except Exception:
        _redis = None
    return _redis


def _key(namespace: str, key: str) -> str:
    # Prefix prevents collisions with other apps sharing the same Redis database.
    return f"brightace:v1:{namespace}:{key}"


async def cache_backend_status() -> dict[str, Any]:
    client = _client()
    if client is None:
        return {"configured": False, "available": False, "mode": "disabled"}
    try:
        await client.ping()
        return {"configured": True, "available": True, "mode": "redis-shared"}
    except Exception:
        return {"configured": True, "available": False, "mode": "redis-unreachable"}


async def get_cache_json(namespace: str, key: str) -> Any | None:
    client = _client()
    if client is None:
        return None
    try:
        raw = await client.get(_key(namespace, key))
        return json.loads(raw) if raw is not None else None
    except Exception:
        return None


async def set_cache_json(namespace: str, key: str, value: Any, ttl_seconds: int) -> bool:
    client = _client()
    if client is None:
        return False
    try:
        raw = json.dumps(value, separators=(",", ":"), ensure_ascii=False, allow_nan=False)
        if len(raw.encode("utf-8")) > 256_000:
            return False
        await client.set(_key(namespace, key), raw, ex=ttl_seconds)
        return True
    except (TypeError, ValueError, Exception):
        return False


async def close_cache() -> None:
    client = _client()
    if client is not None:
        try:
            await client.aclose()
        except Exception:
            pass
