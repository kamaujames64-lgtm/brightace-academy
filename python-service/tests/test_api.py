import os
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["ok"] is True


def test_capabilities_are_honest_until_notebook_added():
    response = client.get("/api/v1/capabilities")
    assert response.status_code == 200
    body = response.json()
    assert body["notebook_connected"] is False
    assert "health_check" in body["enabled_features"]
    assert "text_stats" in body["enabled_features"]


def test_processing_placeholder_is_honest():
    response = client.post("/api/v1/process")
    assert response.status_code == 409


def test_jobs_are_disabled_without_server_secret(monkeypatch):
    monkeypatch.delenv("BRIGHTACE_SERVICE_API_KEY", raising=False)
    response = client.post("/api/v1/jobs", json={"feature": "text_stats", "input": {"text": "hi"}})
    assert response.status_code == 503


def test_jobs_reject_missing_or_wrong_key(monkeypatch):
    monkeypatch.setenv("BRIGHTACE_SERVICE_API_KEY", "test-secret")
    body = {"feature": "text_stats", "input": {"text": "hello world"}}
    assert client.post("/api/v1/jobs", json=body).status_code == 401
    assert client.post("/api/v1/jobs", json=body, headers={"X-BrightAce-Service-Key": "wrong"}).status_code == 401


def test_text_stats_job(monkeypatch):
    monkeypatch.setenv("BRIGHTACE_SERVICE_API_KEY", "test-secret")
    response = client.post(
        "/api/v1/jobs",
        json={"feature": "text_stats", "input": {"text": "BrightAce\nAcademy tools"}},
        headers={"X-BrightAce-Service-Key": "test-secret"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["ok"] is True
    assert body["result"] == {"characters": 23, "words": 3, "lines": 2}


def test_unknown_feature_is_not_executed(monkeypatch):
    monkeypatch.setenv("BRIGHTACE_SERVICE_API_KEY", "test-secret")
    response = client.post(
        "/api/v1/jobs",
        json={"feature": "arbitrary_code", "input": {}},
        headers={"X-BrightAce-Service-Key": "test-secret"},
    )
    assert response.status_code == 404


def test_invalid_feature_input(monkeypatch):
    monkeypatch.setenv("BRIGHTACE_SERVICE_API_KEY", "test-secret")
    response = client.post(
        "/api/v1/jobs",
        json={"feature": "text_stats", "input": {"text": 123}},
        headers={"X-BrightAce-Service-Key": "test-secret"},
    )
    assert response.status_code == 422
