import inspect
import os
import sys

from fastapi.testclient import TestClient

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from main import FullAnalysisResponse, _cache_control_for_path, app


client = TestClient(app)


def test_analysis_endpoint_uses_worker_thread_and_validates_response_contract():
    route = next(route for route in app.routes if getattr(route, "path", None) == "/api/analyze")

    assert not inspect.iscoroutinefunction(route.endpoint)
    assert route.response_model is FullAnalysisResponse


def test_delivery_cache_policy_keeps_bundles_fast_and_shell_updates_fresh():
    assert _cache_control_for_path("/assets/index-abc123.js") == "public, max-age=31536000, immutable"
    assert _cache_control_for_path("/sw.js") == "no-cache, no-store, must-revalidate"
    assert _cache_control_for_path("/welcome", "text/html; charset=utf-8") == "no-cache, no-store, must-revalidate"
    assert _cache_control_for_path("/api/health", "application/json") is None


def test_delivery_middleware_adds_security_headers_and_gzip():
    response = client.get("/openapi.json", headers={"Accept-Encoding": "gzip"})

    assert response.status_code == 200
    assert response.headers["x-content-type-options"] == "nosniff"
    assert response.headers["referrer-policy"] == "strict-origin-when-cross-origin"
    assert response.headers["content-encoding"] == "gzip"
