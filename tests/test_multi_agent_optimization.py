"""
Tests for Multi-Agent Optimization, Step-Level Latency Profiling,
Token Budget Estimation, and Kilo Throughput Orchestration.
Follows agent-orchestration-multi-agent-optimize skill patterns.
"""
import pytest
from fastapi.testclient import TestClient
from rakshak.backend.main import app

client = TestClient(app)


def test_pipeline_latency_and_token_tracking():
    """Verify that individual agent triage captures per-step duration and token metrics."""
    resp = client.post("/api/v1/agents/triage/run?ward_id=HP-MND-01")
    assert resp.status_code == 200
    data = resp.json()

    # Verify pipeline summary telemetry
    assert "total_duration_ms" in data
    assert data["total_duration_ms"] is not None
    assert data["total_duration_ms"] >= 0.0

    assert "estimated_tokens" in data
    assert data["estimated_tokens"] is not None
    assert data["estimated_tokens"] >= 50

    assert "agent_latencies_ms" in data
    latencies = data["agent_latencies_ms"]
    assert "IngestionSentinel" in latencies
    assert "HydrologyReasoner" in latencies
    assert "DispatchCommander" in latencies

    # Verify each execution step has duration and confidence
    trace = data["execution_trace"]
    assert len(trace) >= 9
    for step in trace:
        assert "duration_ms" in step
        assert step["duration_ms"] is not None
        assert "confidence_score" in step
        assert step["confidence_score"] is not None
        assert 0.0 <= step["confidence_score"] <= 1.0


def test_kilo_bottleneck_profiling_and_throughput():
    """Verify that Kilo parallel sweep aggregates throughput, token usage, and per-agent latency."""
    resp = client.post("/api/v1/agents/kilo/orchestrate?district=Mandi&concurrency=8")
    assert resp.status_code == 200
    data = resp.json()

    assert data["status"] == "COMPLETED"
    assert data["total_wards"] >= 8
    assert data["elapsed_wall_time_ms"] > 0

    bottleneck = data["bottleneck_analysis"]
    assert "wards_per_second" in bottleneck
    assert bottleneck["wards_per_second"] > 0
    assert "total_estimated_tokens" in bottleneck
    assert bottleneck["total_estimated_tokens"] > 500

    agent_breakdown = bottleneck["agent_latency_breakdown_ms"]
    assert "IngestionSentinel" in agent_breakdown
    assert "HydrologyReasoner" in agent_breakdown
    assert "DispatchCommander" in agent_breakdown

    assert "fastest_ward" in bottleneck
    assert "slowest_ward" in bottleneck
    assert "concurrency_efficiency_gain" in bottleneck


def test_kilo_status_and_worker_pool():
    """Verify health and queue attributes of Kilo parallel engine."""
    resp = client.get("/api/v1/agents/kilo/status")
    assert resp.status_code == 200
    data = resp.json()

    assert data["engine_name"] == "KiloParallelOrchestrator"
    assert data["healthy"] is True
    assert data["max_concurrency"] >= 5
    assert data["queue_mode"] == "BOUNDED_ASYNCIO_SEMAPHORE"
    assert set(data["supported_agents"]) == {"IngestionSentinel", "HydrologyReasoner", "DispatchCommander"}
