"""
Pydantic contracts and schemas for Rakshak Autonomous Multi-Agent Triage Pipeline.
Designed according to ai-agents-architect patterns with strict typing and HITL governance.
"""
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class AgentExecutionStep(BaseModel):
    agent_name: str = Field(..., description="Name of the acting agent (IngestionSentinel, HydrologyReasoner, DispatchCommander)")
    phase: str = Field(..., description="Reasoning phase (THOUGHT, ACTION, OBSERVATION)")
    detail: str = Field(..., description="Narrative reasoning or tool output")
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    duration_ms: Optional[float] = Field(default=None, description="Step execution latency in milliseconds")
    confidence_score: Optional[float] = Field(default=None, description="Step confidence level from 0.0 to 1.0")


class TelemetryQualityAudit(BaseModel):
    node_id: str
    snr_db: float
    battery_v: float
    packet_loss_pct: float
    is_anomalous: bool
    confidence_score: float = Field(..., description="Data confidence score from 0.0 to 1.0")
    source_status: str = Field(..., description="Hardware channel status (LORA_HEALTHY, SATELLITE_DEGRADED)")


class HydrologyDossier(BaseModel):
    ward_id: str
    ward_name: str
    rainfall_rate_mmh: float
    gsi_threshold_limit_mmh: float
    gsi_threshold_breached: bool
    manning_velocity_ms: float
    downstream_eta_h: float
    composite_risk_score: float
    alert_level: str
    aggravating_factors: List[str]


class EmergencyDirectiveDraft(BaseModel):
    directive_id: str
    ward_id: str
    ward_name: str
    severity: str
    headline: str
    instruction_en: str
    instruction_hi: str
    cap_xml_preview: str
    human_approval_required: bool
    status: str = Field("PENDING_COMMANDER_APPROVAL", description="PENDING_COMMANDER_APPROVAL, APPROVED, OVERRIDDEN")
    generated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class AgentTriagePipelineResult(BaseModel):
    pipeline_id: str
    ward_id: str
    ward_name: str
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    execution_trace: List[AgentExecutionStep]
    telemetry_audit: TelemetryQualityAudit
    hydrology_dossier: HydrologyDossier
    directive: Optional[EmergencyDirectiveDraft] = None
    human_review_required: bool = False
    total_duration_ms: Optional[float] = Field(default=None, description="Total wall-clock duration of the triage pipeline in ms")
    estimated_tokens: Optional[int] = Field(default=None, description="Estimated token budget consumed across thoughts, actions, and directives")
    agent_latencies_ms: Optional[Dict[str, float]] = Field(default=None, description="Per-agent duration breakdown in milliseconds")


class ApproveDirectiveRequest(BaseModel):
    directive_id: str
    ward_id: str
    commander_callsign: str = Field("NDRF-INCIDENT-COMMANDER-01")
    action: str = Field("APPROVE", description="APPROVE or DISMISS")
    notes: Optional[str] = None


class ApproveDirectiveResponse(BaseModel):
    directive_id: str
    status: str
    broadcast_timestamp: str
    message: str
    digital_checksum: str


class KiloOrchestrationResponse(BaseModel):
    batch_id: str
    total_wards: int
    elapsed_wall_time_ms: float
    average_latency_ms: float
    concurrency_limit: int
    critical_breaches: int
    watch_alerts: int
    staged_directives_count: int
    results: List[AgentTriagePipelineResult]
    bottleneck_analysis: Dict[str, Any]
    status: str = "COMPLETED"


class KiloStatusResponse(BaseModel):
    engine_name: str = "KiloParallelOrchestrator"
    max_concurrency: int
    active_tasks: int
    queue_mode: str = "BOUNDED_ASYNCIO_SEMAPHORE"
    supported_agents: List[str]
    healthy: bool = True

