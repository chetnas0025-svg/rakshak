"""
Pydantic v2 Schemas for Rakshak API.
Enforces strict typing, detailed field documentation, and serialization standards.
"""
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class FactorContribution(BaseModel):
    factor_name: str
    display_name: str
    impact_points: float = Field(..., description="Contribution in percentage points to the composite risk score")
    is_aggravating: bool = Field(..., description="True if factor aggressively increases danger")


class WardRiskSummary(BaseModel):
    ward_id: str
    ward_name: str
    district_name: str
    latitude: float
    longitude: float
    risk_score: float = Field(..., ge=0.0, le=100.0, description="Composite flash flood risk score (0 - 100)")
    alert_level: str = Field(..., description="NORMAL | ADVISORY | WATCH | WARNING")
    alert_color: str = Field(..., description="Hex color code (#10b981, #eab308, #f97316, #ef4444)")
    lead_time_hours: float = Field(..., description="Estimated actionable lead time in hours")
    rainfall_current_24h: float
    rainfall_antecedent_72h: float
    is_live_data: bool = True
    last_updated: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class DetailedWardRiskResponse(WardRiskSummary):
    severity_label: str
    factor_contributions: List[FactorContribution]
    features_summary: Dict[str, Any]
    live_sensor_telemetry: Optional[Dict[str, Any]] = None


class DistrictRiskResponse(BaseModel):
    district_name: str
    wards_count: int
    mean_risk_score: float
    max_risk_score: float
    critical_wards_count: int
    wards: List[WardRiskSummary]


class TimeSeriesDataPoint(BaseModel):
    timestamp: str
    rainfall_mm: float
    risk_score: float
    water_level_cm: Optional[float] = None


class HistoryResponse(BaseModel):
    ward_id: str
    ward_name: str
    district_name: str
    points: List[TimeSeriesDataPoint]


class IngestRainfallRequest(BaseModel):
    ward_id: Optional[str] = None
    district_name: Optional[str] = "Mandi"


class IngestRainfallResponse(BaseModel):
    status: str
    ingested_wards_count: int
    duration_ms: float
    source_status: str


class AlertTriggerRequest(BaseModel):
    ward_id: str
    phone_numbers: Optional[List[str]] = None
    custom_instruction: Optional[str] = None


class AlertTriggerResponse(BaseModel):
    success: bool
    ward_id: str
    dispatches_count: int
    dispatches: List[Dict[str, Any]]


class LiteratureBenchmarkSchema(BaseModel):
    study_name: str
    citation: str
    reported_accuracy: float
    reported_roc_auc: float
    context: str


class MeasuredMetricsSchema(BaseModel):
    evaluation_window: str
    validation_wards_count: int
    test_samples_count: int
    positive_events_count: int
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    roc_auc: float
    pr_auc: float
    true_positives: int
    false_positives: int
    true_negatives: int
    false_negatives: int


class ModelInfoResponse(BaseModel):
    model_name: str
    model_version: str
    trained_at: str
    algorithm: str
    features: List[str]
    feature_importances: Dict[str, float]
    literature_benchmark: LiteratureBenchmarkSchema
    measured_validation_metrics: MeasuredMetricsSchema
    disclaimer: str = (
        "Literature benchmark metrics are cited from published research as an architectural reference. "
        "Measured metrics reflect actual evaluation on the 2025 Himachal Pradesh disaster holdout window."
    )


class ValidationEventResponse(BaseModel):
    event_id: str
    date: str
    district: str
    ward_id: str
    location: str
    event_type: str
    description: str
    rainfall_24h_mm: float
    antecedent_72h_mm: float
    flood_occurred: int
    severity: str
    documented_source: str
    model_predicted_risk: float
    model_predicted_level: str
    prediction_accurate: bool


class SensorNodeInfo(BaseModel):
    node_id: str
    node_name: str
    ward_id: str
    ward_name: str
    district_name: str
    latitude: float
    longitude: float
    river_name: str
    water_level_cm: float
    water_level_rate_cm_per_hr: float
    tilt_angle_deg: float
    battery_level_pct: float
    status: str
    last_ping: str


class SimulationRequest(BaseModel):
    rainfall_current_24h: float = Field(..., ge=0.0, le=500.0, description="Simulated 24-hour rainfall in millimeters")
    rainfall_antecedent_72h: float = Field(..., ge=0.0, le=1000.0, description="Simulated 72-hour antecedent rainfall in millimeters")
    ward_id: Optional[str] = Field(default=None, description="Optional specific ward identifier to simulate in detail")


class SimulationResponse(BaseModel):
    simulated_rainfall_24h_mm: float
    simulated_rainfall_72h_mm: float
    wards: List[WardRiskSummary]
    detailed_ward: Optional[DetailedWardRiskResponse] = None


class ReportCategoryEnum(str):
    CRACK = "crack"
    SEEPAGE = "seepage"
    ROCKFALL = "rockfall"
    WATER_RISING = "water_rising"
    OTHER = "other"


class ReporterTypeEnum(str):
    CITIZEN = "citizen"
    FIELD_OFFICER = "field_officer"


class ReportStatusEnum(str):
    PENDING = "pending"
    VERIFIED = "verified"
    REJECTED = "rejected"


class SubmitReportRequest(BaseModel):
    category: str = Field(..., description="crack | seepage | rockfall | water_rising | other")
    latitude: float = Field(..., ge=28.0, le=34.0, description="Latitude from device GPS (HP bounding box)")
    longitude: float = Field(..., ge=74.0, le=80.0, description="Longitude from device GPS (HP bounding box)")
    ward_id: Optional[str] = Field(default=None, description="Optional explicit ward_id if GPS is poor")
    description: Optional[str] = Field(default=None, max_length=500)
    reporter_type: str = Field(default="citizen", description="citizen | field_officer")
    reporter_contact: Optional[str] = Field(default=None, description="Phone number for follow-up")
    photo_base64: Optional[str] = Field(default=None, description="Optional compressed base64 image data")


class VerifyReportRequest(BaseModel):
    action: str = Field(..., description="verify | reject")
    officer_id: Optional[str] = Field(default="OFFICER-NDRF-01", description="Identifier of verifying officer")
    notes: Optional[str] = Field(default=None, max_length=300)


class HazardReportResponse(BaseModel):
    id: str
    ward_id: str
    ward_name: str
    district_name: str
    latitude: float
    longitude: float
    category: str
    photo_url: Optional[str] = None
    description: Optional[str] = None
    reporter_type: str
    reporter_contact: Optional[str] = None
    status: str
    verified_by: Optional[str] = None
    verified_at: Optional[str] = None
    created_at: str
    risk_boost_applied: bool = False
    applied_boost_percent: float = 0.0


class WardRiskAdjustmentRecord(BaseModel):
    adjustment_id: str
    ward_id: str
    report_id: str
    previous_risk_score: float
    boosted_risk_score: float
    applied_boost_percent: float
    reason: str
    timestamp: str


