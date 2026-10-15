"""Small, testable feature registry for BrightAce Python workloads.

Add notebook-derived functions here only after their inputs, outputs, dependencies,
and privacy requirements have been reviewed.
"""
from __future__ import annotations

from typing import Any, Callable

Feature = Callable[[dict[str, Any]], dict[str, Any]]


def text_stats(payload: dict[str, Any]) -> dict[str, Any]:
    """A harmless end-to-end smoke-test feature; not a substitute for notebook logic."""
    text = payload.get("text")
    if not isinstance(text, str):
        raise ValueError("Input field 'text' must be a string.")
    if len(text) > 100_000:
        raise ValueError("Text input exceeds the 100,000-character limit.")
    words = text.split()
    return {
        "characters": len(text),
        "words": len(words),
        "lines": len(text.splitlines()) if text else 0,
    }


FEATURES: dict[str, Feature] = {
    "text_stats": text_stats,
}


def run_feature(name: str, payload: dict[str, Any]) -> dict[str, Any]:
    feature = FEATURES.get(name)
    if feature is None:
        raise KeyError(name)
    return feature(payload)
