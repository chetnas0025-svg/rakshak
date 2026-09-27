"""
Unit tests for Ingestion Adapters and graceful degradation.
"""
import pytest
from rakshak.ingestion.base import BaseAdapter, AdapterHealthStatus, IngestionResult
from rakshak.ingestion.imd_rainfall import RainfallAdapter
from rakshak.ingestion.terrain_dem import TerrainDEMAdapter
from rakshak.ingestion.soil_moisture import SoilMoistureAdapter
from rakshak.ingestion.sensor_stream import (
    SensorTelemetryPayload,
    process_sensor_reading,
    TelemetrySource
)


@pytest.mark.asyncio
async def test_rainfall_adapter_structure():
    adapter = RainfallAdapter()
    assert adapter.name == "IMD_Rainfall_Adapter"
    assert adapter.status == AdapterHealthStatus.HEALTHY
    summary = adapter.get_status_summary()
    assert summary["name"] == adapter.name


@pytest.mark.asyncio
async def test_terrain_dem_adapter_structure():
    adapter = TerrainDEMAdapter()
    assert adapter.name == "SRTM_DEM_Terrain_Adapter"
    summary = adapter.get_status_summary()
    assert summary["status"] == "HEALTHY"


@pytest.mark.asyncio
async def test_soil_moisture_adapter_structure():
    adapter = SoilMoistureAdapter()
    assert adapter.name == "NASA_SMAP_Soil_Moisture_Adapter"


def test_sensor_stream_normal():
    payload = SensorTelemetryPayload(
        node_id="ESP32-MND-01",
        ward_id="HP-MND-01",
        source=TelemetrySource.SENSOR,
        water_level_cm=140.5,
        water_level_rate_cm_per_hr=4.2,
        tilt_angle_deg=1.1,
        battery_level_pct=92.0
    )
    res = process_sensor_reading(payload)
    assert res.received is True
    assert res.anomaly_detected is False
    assert res.warning_flag is None


def test_sensor_stream_surge_anomaly():
    """Water rising > 30 cm/hr or above 450cm must trigger surge anomaly."""
    payload = SensorTelemetryPayload(
        node_id="ESP32-MND-02",
        ward_id="HP-MND-02",
        source=TelemetrySource.SENSOR,
        water_level_cm=480.0,
        water_level_rate_cm_per_hr=55.0,
        tilt_angle_deg=7.5,
        battery_level_pct=88.0
    )
    res = process_sensor_reading(payload)
    assert res.received is True
    assert res.anomaly_detected is True
    assert "RAPID_WATER_SURGE" in res.warning_flag
    assert "OVERFLOW" in res.warning_flag
    assert "SLOPE_TILT" in res.warning_flag


def test_adapter_failure_tracking():
    adapter = RainfallAdapter()
    adapter.record_failure(Exception("Timeout 1"))
    assert adapter.status == AdapterHealthStatus.DEGRADED
    assert adapter.consecutive_failures == 1

    adapter.record_failure(Exception("Timeout 2"))
    adapter.record_failure(Exception("Timeout 3"))
    assert adapter.status == AdapterHealthStatus.UNAVAILABLE
    assert adapter.consecutive_failures == 3

    adapter.record_success(45.2)
    assert adapter.status == AdapterHealthStatus.HEALTHY
    assert adapter.consecutive_failures == 0
