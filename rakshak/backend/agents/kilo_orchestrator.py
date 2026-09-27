"""
Kilo Parallel Multi-Agent Orchestrator.
Engineers coordinated, high-throughput parallel execution of IngestionSentinel,
HydrologyReasoner, and DispatchCommander across all monitored wards simultaneously.
Optimized according to agent-orchestration-multi-agent-optimize principles.
"""
import asyncio
import time
import uuid
from typing import List, Optional, Dict, Any
from concurrent.futures import ThreadPoolExecutor

from rakshak.backend.agents.contracts import (
    AgentTriagePipelineResult,
    KiloOrchestrationResponse,
    KiloStatusResponse
)
from rakshak.backend.agents.pipeline import agent_orchestrator
from rakshak.backend.services.ward_registry import ward_registry


class KiloParallelOrchestrator:
    """
    High-performance async engine for parallel agent triage across mountain catchments.
    Controls concurrency boundaries, tracks latency, and aggregates regional threat matrices.
    """

    def __init__(self, default_concurrency: int = 10):
        self.default_concurrency = default_concurrency
        self.active_tasks = 0
        self._thread_pool = ThreadPoolExecutor(max_workers=16, thread_name_prefix="kilo-agent-worker")

    def get_status(self) -> KiloStatusResponse:
        return KiloStatusResponse(
            engine_name="KiloParallelOrchestrator",
            max_concurrency=self.default_concurrency,
            active_tasks=self.active_tasks,
            queue_mode="BOUNDED_ASYNCIO_SEMAPHORE",
            supported_agents=["IngestionSentinel", "HydrologyReasoner", "DispatchCommander"],
            healthy=True
        )

    async def _triage_worker(self, ward_id: str, semaphore: asyncio.Semaphore) -> AgentTriagePipelineResult:
        async with semaphore:
            loop = asyncio.get_running_loop()
            self.active_tasks += 1
            try:
                # Offload CPU / sync I-D curve & CAP generator to worker thread pool
                result = await loop.run_in_executor(
                    self._thread_pool,
                    agent_orchestrator.run_triage,
                    ward_id
                )
                return result
            finally:
                self.active_tasks -= 1

    async def orchestrate_catchment_sweep(
        self,
        district_filter: Optional[str] = None,
        concurrency_limit: Optional[int] = None
    ) -> KiloOrchestrationResponse:
        start_time = time.perf_counter()
        concurrency = concurrency_limit or self.default_concurrency
        semaphore = asyncio.Semaphore(concurrency)

        # Retrieve target wards
        if district_filter and district_filter.lower() != "all":
            wards = ward_registry.get_wards_by_district(district_filter)
        else:
            wards = ward_registry.get_all_wards()

        ward_ids = [w.ward_id for w in wards]
        batch_id = f"KILO-{uuid.uuid4().hex[:8].upper()}"

        # Dispatch parallel tasks across all wards
        tasks = [self._triage_worker(wid, semaphore) for wid in ward_ids]
        results: List[AgentTriagePipelineResult] = await asyncio.gather(*tasks)

        elapsed_ms = round((time.perf_counter() - start_time) * 1000.0, 2)
        avg_latency = round(elapsed_ms / max(len(results), 1), 2)

        critical_breaches = sum(1 for r in results if r.hydrology_dossier.gsi_threshold_breached)
        watch_alerts = sum(1 for r in results if r.hydrology_dossier.alert_level == "WATCH")
        staged_directives = sum(1 for r in results if r.human_review_required)

        sentinel_total = sum(r.agent_latencies_ms.get("IngestionSentinel", 0.0) if r.agent_latencies_ms else 0.0 for r in results)
        reasoner_total = sum(r.agent_latencies_ms.get("HydrologyReasoner", 0.0) if r.agent_latencies_ms else 0.0 for r in results)
        commander_total = sum(r.agent_latencies_ms.get("DispatchCommander", 0.0) if r.agent_latencies_ms else 0.0 for r in results)
        total_tokens = sum(r.estimated_tokens or 0 for r in results)

        bottleneck_analysis = {
            "fastest_ward": min(results, key=lambda r: r.total_duration_ms or len(r.execution_trace)).ward_name if results else "N/A",
            "slowest_ward": max(results, key=lambda r: r.total_duration_ms or len(r.execution_trace)).ward_name if results else "N/A",
            "wards_per_second": round(len(results) / max(elapsed_ms / 1000.0, 0.001), 2),
            "average_confidence_pct": round(
                (sum(r.telemetry_audit.confidence_score for r in results) / max(len(results), 1)) * 100.0, 1
            ),
            "concurrency_efficiency_gain": round(
                (len(results) * 18.0) / max(elapsed_ms, 1.0), 2
            ),
            "agent_latency_breakdown_ms": {
                "IngestionSentinel": round(sentinel_total / max(len(results), 1), 2),
                "HydrologyReasoner": round(reasoner_total / max(len(results), 1), 2),
                "DispatchCommander": round(commander_total / max(len(results), 1), 2),
            },
            "total_estimated_tokens": total_tokens,
            "thread_workers_configured": 16
        }

        return KiloOrchestrationResponse(
            batch_id=batch_id,
            total_wards=len(results),
            elapsed_wall_time_ms=elapsed_ms,
            average_latency_ms=avg_latency,
            concurrency_limit=concurrency,
            critical_breaches=critical_breaches,
            watch_alerts=watch_alerts,
            staged_directives_count=staged_directives,
            results=results,
            bottleneck_analysis=bottleneck_analysis,
            status="COMPLETED"
        )


kilo_orchestrator = KiloParallelOrchestrator()
