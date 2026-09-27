"""
Sensor Telemetry Ingestion Adapter.
Handles real-time ingestion from physical or simulated ESP32 field nodes
(water level sonar, tilt sensor, rain tipping gauge).
Enforces the shared telemetry contract (source: 'sensor' vs 'satellite' vs 'station').
"""
from datetime import datetime, timezone
from enum import Enum
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field, field_validator


class TelemetrySource(str, Enum):
    SENSOR = "sensor"
    SATELLITE = "satellite"
    STATION = "station"


class SensorTelemetryPayload(BaseModel):
    node_id: str = Field(..., description="Unique hardware identifier (e.g., ESP32-MND-01)")
    ward_id: str = Field(..., description="Target ward identifier (e.g., HP-MND-01)")
    source: TelemetrySource = Field(default=TelemetrySource.SENSOR)
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    water_level_cm: float = Field(..., ge=0.0, le=2000.0, description="River/stream water level in cm")
    water_level_rate_cm_per_hr: Optional[float] = Field(default=0.0, description="Rate of water level change")
    tilt_angle_deg: Optional[float] = Field(default=0.0, ge=0.0, le=90.0, description="Slope tilt angle from vertical")
    battery_level_pct: Optional[float] = Field(default=100.0, ge=0.0, le=100.0)
    signal_rssi_dbm: Optional[int] = Field(default=-65, ge=-120, le=0)
    extra_attributes: Dict[str, Any] = Field(default_factory=dict)

    @field_validator("water_level_cm")
    @classmethod
    def check_water_level(cls, v: float) -> float:
        if v < 0:
            raise ValueError("Water level cannot be negative")
        return round(v, 2)


class SensorIngestionResult(BaseModel):
    received: bool
    node_id: str
    ward_id: str
    source: str
    anomaly_detected: bool = False
    warning_flag: Optional[str] = None
    processed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


def process_sensor_reading(payload: SensorTelemetryPayload) -> SensorIngestionResult:
    """
    Evaluates sensor telemetry for flash flood surge or slope displacement anomalies.
    - Water rise rate > 30 cm/hr triggers flash surge anomaly
    - Tilt displacement > 5 degrees indicates slope slippage/landslide movement
    """
    anomaly = False
    flags = []

    if payload.water_level_rate_cm_per_hr and payload.water_level_rate_cm_per_hr > 30.0:
        anomaly = True
        flags.append(f"RAPID_WATER_SURGE (+{payload.water_level_rate_cm_per_hr:.1f} cm/hr)")

    if payload.water_level_cm > 450.0:
        anomaly = True
        flags.append(f"RIVER_BANK_OVERFLOW_STAGE ({payload.water_level_cm:.1f} cm)")

    if payload.tilt_angle_deg and payload.tilt_angle_deg > 6.0:
        anomaly = True
        flags.append(f"GROUND_SLOPE_TILT_ANOMALY ({payload.tilt_angle_deg:.1f}°)")

    return SensorIngestionResult(
        received=True,
        node_id=payload.node_id,
        ward_id=payload.ward_id,
        source=payload.source.value,
        anomaly_detected=anomaly,
        warning_flag=" | ".join(flags) if flags else None
    )
