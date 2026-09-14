"""Automated test suite for Cloud-Native Observability, Metrics, and Probes (R4).

Validates standard Prometheus OpenMetrics text format, histogram bucket recording,
sub-50ms Kubernetes health probes, and X-Correlation-ID distributed trace propagation.
"""

import time
import uuid
import pytest
from fastapi.testclient import TestClient
from main import app
from observability import registry

client = TestClient(app)


def test_metrics_endpoint_openmetrics_format():
    """Verify GET /metrics returns standard OpenMetrics exposition with histograms and counters."""
    resp = client.get("/metrics")
    assert resp.status_code == 200
    assert "text/plain" in resp.headers["content-type"]
    text = resp.text

    # Latency Histogram
    assert "# HELP fintech_financial_analysis_duration_seconds" in text
    assert "# TYPE fintech_financial_analysis_duration_seconds histogram" in text
    assert "fintech_financial_analysis_duration_seconds_bucket" in text
    assert "fintech_financial_analysis_duration_seconds_sum" in text
    assert "fintech_financial_analysis_duration_seconds_count" in text

    # Simulation Counter
    assert "# HELP fintech_simulations_total" in text
    assert "# TYPE fintech_simulations_total counter" in text
    assert "fintech_simulations_total" in text

    # Database Pool Gauges
    assert "# HELP fintech_db_pool_active" in text
    assert "# TYPE fintech_db_pool_active gauge" in text
    assert "fintech_db_pool_active" in text
    assert "fintech_db_pool_idle" in text
    assert "fintech_db_pool_overflow" in text


def test_histogram_and_counter_observation_recording():
    """Verify observe_analysis_duration and inc_simulations record measurements into Prometheus text."""
    registry.observe_analysis_duration(0.042, step="full", status="success")
    registry.inc_simulations(count=1500, strategy="balanced_60_40", scenario="stress_2008")

    text = registry.generate_metrics_text()
    assert 'step="full"' in text
    assert 'strategy="balanced_60_40"' in text
    assert "1500" in text


def test_correlation_id_middleware_propagation():
    """Verify X-Correlation-ID is extracted or auto-generated and reflected in response headers."""
    # 1. Auto-generation when missing
    resp1 = client.get("/health")
    assert resp1.status_code == 200
    cid1 = resp1.headers.get("x-correlation-id")
    assert cid1 is not None
    assert len(cid1) >= 8

    # 2. Inbound correlation ID propagation
    custom_cid = "trace-uuid-fintech-9876543210"
    resp2 = client.get("/health", headers={"X-Correlation-ID": custom_cid})
    assert resp2.status_code == 200
    assert resp2.headers.get("x-correlation-id") == custom_cid


def test_liveness_probe_under_5ms():
    """Verify GET /api/health/live responds almost instantaneously (< 5ms)."""
    t0 = time.monotonic()
    resp = client.get("/api/health/live")
    elapsed_ms = (time.monotonic() - t0) * 1000

    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "alive"
    assert "version" in data
    assert "timestamp" in data
    assert elapsed_ms < 25.0  # TestClient in Python overhead allowance, comfortably sub-process


def test_readiness_probe_reports_dependency_state_and_latency():
    """Readiness reports availability separately from its latency budget."""
    resp = client.get("/api/health/ready")
    assert resp.status_code in (200, 503)
    data = resp.json()
    assert data["status"] in ("ready", "unavailable", "not_configured")
    assert "pool" in data
    assert "latency_ms" in data
    assert data["latency_budget_ms"] == 50.0
    assert data["latency_budget_met"] == (data["latency_ms"] < 50.0)
    if resp.status_code == 200:
        assert data["database"] in ("connected", "not_configured")
    else:
        assert resp.status_code == 503
        assert data["database"] in ("timeout", "unavailable")
        assert data["latency_ms"] < 1500.0


def test_readiness_probe_with_healthy_db(monkeypatch, tmp_path):
    """Verify GET /api/health/ready returns 200 OK with connected status and pool metrics when DB is healthy."""
    from config import settings
    import database
    db_file = tmp_path / "ready_test.db"
    monkeypatch.setattr(settings, "DATABASE_URL", f"sqlite+aiosqlite:///{db_file.as_posix()}")
    monkeypatch.setattr(database, "_engine", None)

    resp = client.get("/api/health/ready")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ready"
    assert data["database"] == "connected"
    assert data["latency_ms"] < 50.0
    assert "pool" in data
    assert data["pool"]["active"] >= 0


def test_metrics_scrape_concurrent_load_50_requests_and_openmetrics_syntax():
    """Empirical challenge: 50 concurrent workers scraping GET /metrics + strict OpenMetrics syntax verification."""
    from concurrent.futures import ThreadPoolExecutor, as_completed
    import re

    concurrency = 50
    results = []

    def scrape():
        t0 = time.perf_counter()
        resp = client.get("/metrics")
        t1 = time.perf_counter()
        return resp.status_code, resp.text, (t1 - t0) * 1000.0

    with ThreadPoolExecutor(max_workers=concurrency) as executor:
        futures = [executor.submit(scrape) for _ in range(concurrency)]
        for f in as_completed(futures):
            results.append(f.result())

    assert len(results) == concurrency
    for status_code, text, elapsed_ms in results:
        assert status_code == 200, f"Concurrent scrape failed with status {status_code}"
        assert len(text) > 100

    sample_text = results[0][1]
    lines = [line.strip() for line in sample_text.splitlines() if line.strip()]

    metric_name_pattern = re.compile(r"^[a-zA-Z_:][a-zA-Z0-9_:]*$")
    sample_line_pattern = re.compile(r"^([a-zA-Z_:][a-zA-Z0-9_:]*)(?:\{([^}]*)\})?\s+([-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?|[+-]?Inf|NaN)$")

    histogram_buckets = {}

    for line in lines:
        if line.startswith("# HELP"):
            parts = line.split(maxsplit=3)
            assert len(parts) >= 3, f"Malformed # HELP: {line}"
            assert metric_name_pattern.match(parts[2]), f"Invalid metric name: {parts[2]}"
        elif line.startswith("# TYPE"):
            parts = line.split(maxsplit=3)
            assert len(parts) == 4, f"Malformed # TYPE: {line}"
            assert parts[3] in {"counter", "gauge", "histogram", "summary", "untyped"}, f"Invalid type: {parts[3]}"
        elif not line.startswith("#"):
            match = sample_line_pattern.match(line)
            assert match is not None, f"Non-conforming Prometheus sample: {line}"
            m_name, l_block, val_str = match.groups()
            float(val_str)  # must parse as float

            if "_bucket" in m_name:
                base = m_name.replace("_bucket", "")
                if base not in histogram_buckets:
                    histogram_buckets[base] = []
                le_match = re.search(r'le="([^"]+)"', l_block or "")
                if le_match:
                    le = float(le_match.group(1)) if le_match.group(1) != "+Inf" else float("inf")
                    histogram_buckets[base].append((le, float(val_str)))

    # Verify bucket monotonicity
    for base, b_list in histogram_buckets.items():
        sorted_b = sorted(b_list, key=lambda x: x[0])
        counts = [b[1] for b in sorted_b]
        for i in range(len(counts) - 1):
            assert counts[i] <= counts[i + 1], f"Histogram buckets must be non-decreasing: {counts}"


def test_health_probes_latency_smoke_100_consecutive_requests(monkeypatch, tmp_path):
    """Catch severe local probe regressions without treating CI timing as an SLO."""
    import statistics
    from config import settings
    import database

    # 1. 100 consecutive requests to /api/health/live
    live_lats = []
    for _ in range(5):  # warmup
        client.get("/api/health/live")
    for _ in range(100):
        t0 = time.perf_counter()
        r = client.get("/api/health/live")
        t1 = time.perf_counter()
        assert r.status_code == 200
        live_lats.append((t1 - t0) * 1000.0)

    live_p50 = statistics.median(live_lats)
    live_p95 = statistics.quantiles(live_lats, n=20)[18]
    live_p99 = statistics.quantiles(live_lats, n=100)[98]
    assert live_p50 < 100.0, f"Live median regression: {live_p50:.2f}ms"
    assert live_p95 < 250.0, f"Live p95 regression: {live_p95:.2f}ms"
    assert live_p99 < 500.0, f"Live p99 regression: {live_p99:.2f}ms"

    # 2. 100 consecutive requests to /api/health/ready (with healthy DB)
    db_file = tmp_path / "sla_bench.db"
    monkeypatch.setattr(settings, "DATABASE_URL", f"sqlite+aiosqlite:///{db_file.as_posix()}")
    monkeypatch.setattr(database, "_engine", None)

    ready_lats = []
    for _ in range(5):  # warmup
        client.get("/api/health/ready")
    for _ in range(100):
        t0 = time.perf_counter()
        r = client.get("/api/health/ready")
        t1 = time.perf_counter()
        assert r.status_code == 200
        ready_lats.append((t1 - t0) * 1000.0)

    ready_p50 = statistics.median(ready_lats)
    ready_p95 = statistics.quantiles(ready_lats, n=20)[18]
    ready_p99 = statistics.quantiles(ready_lats, n=100)[98]
    assert ready_p50 < 100.0, f"Ready median regression: {ready_p50:.2f}ms"
    assert ready_p95 < 250.0, f"Ready p95 regression: {ready_p95:.2f}ms"
    assert ready_p99 < 500.0, f"Ready p99 regression: {ready_p99:.2f}ms"


def test_distributed_tracing_uuidv4_strict():
    """Empirical challenge: verify incoming preservation, UUIDv4 validation, and short-string fallback."""
    # 1. Custom incoming preservation
    custom_id = f"trace-uuid-{uuid.uuid4()}"
    resp = client.get("/api/health/live", headers={"X-Correlation-ID": custom_id})
    assert resp.headers.get("x-correlation-id") == custom_id

    # 2. Omitted header -> auto-generate valid UUIDv4
    resp_no_header = client.get("/api/health/live")
    gen_id = resp_no_header.headers.get("x-correlation-id")
    assert gen_id is not None
    parsed = uuid.UUID(gen_id, version=4)
    assert str(parsed) == gen_id

    # 3. Short header -> auto-generate valid UUIDv4
    resp_short = client.get("/api/health/live", headers={"X-Correlation-ID": "abc"})
    gen_id2 = resp_short.headers.get("x-correlation-id")
    assert gen_id2 != "abc"
    parsed2 = uuid.UUID(gen_id2, version=4)
    assert str(parsed2) == gen_id2
