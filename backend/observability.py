"""Cloud-Native Prometheus Observability, OpenMetrics Registry, and Distributed Tracing.

Implements standard OpenMetrics text exposition (/metrics) with:
- Latency histogram buckets for financial analysis execution
- Monte Carlo and stress test simulation throughput counters
- Database connection pool health gauges
- W3C/ASGI Correlation ID middleware and structlog integration
"""

from __future__ import annotations

import threading
import time
import uuid
from typing import Any, Callable, Dict, List, Optional, Tuple
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
import structlog
from database import get_db_pool_stats

logger = structlog.get_logger(__name__)

# Standard Prometheus histogram buckets for sub-second financial calculations
HISTOGRAM_BUCKETS = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0]


class PrometheusRegistry:
    """Thread-safe Prometheus / OpenMetrics in-memory registry."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        # Histogram: (step, status) -> (bucket_counts, sum, count)
        self._histograms: Dict[str, Dict[Tuple[str, str], Tuple[List[int], float, int]]] = {
            "fintech_financial_analysis_duration_seconds": {}
        }
        # Counter: name -> {label_tuple -> value}
        self._counters: Dict[str, Dict[Tuple[Tuple[str, str], ...], int]] = {
            "fintech_simulations_total": {},
            "fintech_http_requests_total": {},
            "fintech_stress_tests_executed_total": {},
        }
        # Static or dynamic gauges
        self._gauges: Dict[str, Dict[Tuple[Tuple[str, str], ...], float]] = {}

    def observe_analysis_duration(self, duration: float, step: str = "full", status: str = "success") -> None:
        with self._lock:
            h_map = self._histograms["fintech_financial_analysis_duration_seconds"]
            key = (step, status)
            if key not in h_map:
                h_map[key] = ([0] * len(HISTOGRAM_BUCKETS), 0.0, 0)
            buckets, total_sum, count = h_map[key]
            for i, b in enumerate(HISTOGRAM_BUCKETS):
                if duration <= b:
                    buckets[i] += 1
            h_map[key] = (buckets, total_sum + duration, count + 1)

    def inc_simulations(self, count: int = 1, strategy: str = "global_core", scenario: str = "baseline") -> None:
        with self._lock:
            c_map = self._counters["fintech_simulations_total"]
            labels = (("scenario", scenario), ("strategy", strategy))
            c_map[labels] = c_map.get(labels, 0) + count

    def inc_http_requests(self, method: str, handler: str, status_code: int) -> None:
        with self._lock:
            c_map = self._counters["fintech_http_requests_total"]
            labels = (("handler", handler), ("method", method), ("status_code", str(status_code)))
            c_map[labels] = c_map.get(labels, 0) + 1

    def inc_stress_tests(self, scenario: str) -> None:
        with self._lock:
            c_map = self._counters["fintech_stress_tests_executed_total"]
            labels = (("scenario", scenario),)
            c_map[labels] = c_map.get(labels, 0) + 1

    def generate_metrics_text(self) -> str:
        """Render all metrics in standard OpenMetrics / Prometheus exposition text format."""
        lines: List[str] = []

        # 1. Latency Histogram
        lines.append("# HELP fintech_financial_analysis_duration_seconds Execution duration of actuarial engines in seconds.")
        lines.append("# TYPE fintech_financial_analysis_duration_seconds histogram")
        with self._lock:
            h_map = dict(self._histograms["fintech_financial_analysis_duration_seconds"])

        if not h_map:
            # Emit empty default histogram template
            for b in HISTOGRAM_BUCKETS:
                lines.append(f'fintech_financial_analysis_duration_seconds_bucket{{le="{b}",status="success",step="full"}} 0')
            lines.append('fintech_financial_analysis_duration_seconds_bucket{le="+Inf",status="success",step="full"} 0')
            lines.append('fintech_financial_analysis_duration_seconds_sum{status="success",step="full"} 0.0')
            lines.append('fintech_financial_analysis_duration_seconds_count{status="success",step="full"} 0')
        else:
            for (step, status), (buckets, total_sum, count) in sorted(h_map.items()):
                for i, b in enumerate(HISTOGRAM_BUCKETS):
                    lines.append(f'fintech_financial_analysis_duration_seconds_bucket{{le="{b}",status="{status}",step="{step}"}} {buckets[i]}')
                lines.append(f'fintech_financial_analysis_duration_seconds_bucket{{le="+Inf",status="{status}",step="{step}"}} {count}')
                lines.append(f'fintech_financial_analysis_duration_seconds_sum{{status="{status}",step="{step}"}} {total_sum:.6f}')
                lines.append(f'fintech_financial_analysis_duration_seconds_count{{status="{status}",step="{step}"}} {count}')

        # 2. Simulations Counter
        lines.append("\n# HELP fintech_simulations_total Total number of Monte Carlo & stress test simulation paths.")
        lines.append("# TYPE fintech_simulations_total counter")
        with self._lock:
            sim_map = dict(self._counters["fintech_simulations_total"])
        if not sim_map:
            lines.append('fintech_simulations_total{scenario="default",strategy="global_core"} 0')
        else:
            for labels, val in sorted(sim_map.items()):
                label_str = ",".join(f'{k}="{v}"' for k, v in labels)
                lines.append(f"fintech_simulations_total{{{label_str}}} {val}")

        # 3. HTTP Requests Counter
        lines.append("\n# HELP fintech_http_requests_total Total HTTP requests handled by the API.")
        lines.append("# TYPE fintech_http_requests_total counter")
        with self._lock:
            http_map = dict(self._counters["fintech_http_requests_total"])
        if not http_map:
            lines.append('fintech_http_requests_total{handler="/api/health",method="GET",status_code="200"} 0')
        else:
            for labels, val in sorted(http_map.items()):
                label_str = ",".join(f'{k}="{v}"' for k, v in labels)
                lines.append(f"fintech_http_requests_total{{{label_str}}} {val}")

        # 4. Stress Tests Counter
        lines.append("\n# HELP fintech_stress_tests_executed_total Total crisis stress tests executed.")
        lines.append("# TYPE fintech_stress_tests_executed_total counter")
        with self._lock:
            st_map = dict(self._counters["fintech_stress_tests_executed_total"])
        if not st_map:
            lines.append('fintech_stress_tests_executed_total{scenario="gfc_2008"} 0')
        else:
            for labels, val in sorted(st_map.items()):
                label_str = ",".join(f'{k}="{v}"' for k, v in labels)
                lines.append(f"fintech_stress_tests_executed_total{{{label_str}}} {val}")

        # 5. Database Connection Pool Gauges (dynamic from engine)
        pool_stats = get_db_pool_stats()
        lines.append("\n# HELP fintech_db_pool_active Number of active connections checked out from the pool.")
        lines.append("# TYPE fintech_db_pool_active gauge")
        lines.append(f"fintech_db_pool_active {pool_stats['active']}")

        lines.append("\n# HELP fintech_db_pool_idle Number of idle connections available in the pool.")
        lines.append("# TYPE fintech_db_pool_idle gauge")
        lines.append(f"fintech_db_pool_idle {pool_stats['idle']}")

        lines.append("\n# HELP fintech_db_pool_overflow Number of overflow connections beyond standard pool size.")
        lines.append("# TYPE fintech_db_pool_overflow gauge")
        lines.append(f"fintech_db_pool_overflow {pool_stats['overflow']}\n")

        return "\n".join(lines)


# Singleton Registry
registry = PrometheusRegistry()


class CorrelationIdMiddleware(BaseHTTPMiddleware):
    """Extracts or generates X-Correlation-ID, sets response header, and binds to structlog."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        inbound_corr_id = request.headers.get("X-Correlation-ID")
        if inbound_corr_id and len(inbound_corr_id.strip()) >= 8:
            corr_id = inbound_corr_id.strip()
        else:
            corr_id = str(uuid.uuid4())

        request.state.correlation_id = corr_id
        structlog.contextvars.bind_contextvars(correlation_id=corr_id)

        start_time = time.monotonic()
        response: Response = await call_next(request)
        duration = time.monotonic() - start_time

        response.headers["X-Correlation-ID"] = corr_id

        # Track endpoint metrics
        path = request.url.path
        if path.startswith("/api"):
            registry.inc_http_requests(
                method=request.method,
                handler=path,
                status_code=response.status_code,
            )

        return response
