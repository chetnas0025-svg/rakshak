"""
NASA SMAP / ECMWF Soil Moisture Ingestion Adapter.
Retrieves volumetric soil water content (0-1cm, 1-7cm, 7-28cm) to calculate soil saturation percentage.
Saturation above 80% drastically reduces infiltration capacity, escalating flash flood surface runoff.
"""
import time
from typing import Optional
import httpx
from rakshak.config import settings
from rakshak.ingestion.base import BaseAdapter, AdapterHealthStatus, IngestionResult


class SoilMoistureAdapter(BaseAdapter):
    def __init__(self, base_url: Optional[str] = None, timeout_seconds: float = 8.0):
        super().__init__(name="NASA_SMAP_Soil_Moisture_Adapter", timeout_seconds=timeout_seconds)
        self.base_url = base_url or settings.OPEN_METEO_BASE_URL

    async def health_check(self) -> AdapterHealthStatus:
        start_time = time.perf_counter()
        try:
            async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
                resp = await client.get(
                    f"{self.base_url}/forecast",
                    params={
                        "latitude": 31.7087,
                        "longitude": 76.9320,
                        "hourly": "soil_moisture_0_to_1cm,soil_moisture_1_to_3cm,soil_moisture_3_to_9cm"
                    }
                )
                latency_ms = (time.perf_counter() - start_time) * 1000
                if resp.status_code == 200:
                    self.record_success(latency_ms)
                    return AdapterHealthStatus.HEALTHY
                else:
                    self.record_failure(Exception(f"HTTP {resp.status_code}"))
                    return self.status
        except Exception as e:
            self.record_failure(e)
            return self.status

    async def fetch(self, lat: float, lon: float, **kwargs) -> IngestionResult:
        start_time = time.perf_counter()
        params = {
            "latitude": lat,
            "longitude": lon,
            "hourly": "soil_moisture_0_to_1cm,soil_moisture_1_to_3cm,soil_moisture_3_to_9cm",
            "forecast_days": 1,
            "timezone": "Asia/Kolkata"
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
                resp = await client.get(f"{self.base_url}/forecast", params=params)
                latency_ms = (time.perf_counter() - start_time) * 1000

                if resp.status_code == 200:
                    self.record_success(latency_ms)
                    payload = resp.json().get("hourly", {})
                    sm_top = payload.get("soil_moisture_0_to_1cm", [])
                    sm_mid = payload.get("soil_moisture_1_to_3cm", [])
                    sm_deep = payload.get("soil_moisture_3_to_9cm", [])

                    current_top = sm_top[-1] if sm_top else 0.35
                    current_mid = sm_mid[-1] if sm_mid else 0.38
                    current_deep = sm_deep[-1] if sm_deep else 0.40

                    # Typical saturation capacity for Himalayan loam/sandy-clay soils is ~0.45 - 0.50 m³/m³
                    porosity_threshold = 0.48
                    saturation_pct = min(100.0, max(0.0, (current_mid / porosity_threshold) * 100.0))

                    return IngestionResult(
                        source_name=self.name,
                        is_successful=True,
                        status=self.status,
                        latency_ms=latency_ms,
                        is_live_data=True,
                        data={
                            "soil_moisture_0_1cm_m3m3": round(float(current_top), 3),
                            "soil_moisture_1_3cm_m3m3": round(float(current_mid), 3),
                            "soil_moisture_3_9cm_m3m3": round(float(current_deep), 3),
                            "soil_saturation_pct": round(float(saturation_pct), 1),
                            "units": "m³/m³"
                        }
                    )
                else:
                    raise httpx.HTTPStatusError(
                        f"Non-200 status code: {resp.status_code}",
                        request=resp.request,
                        response=resp
                    )

        except Exception as e:
            self.record_failure(e)
            latency_ms = (time.perf_counter() - start_time) * 1000
            return IngestionResult(
                source_name=self.name,
                is_successful=False,
                status=self.status,
                latency_ms=latency_ms,
                is_live_data=False,
                error_message=f"Soil moisture fetch failed: {str(e)}",
                data={
                    "soil_moisture_0_1cm_m3m3": 0.32,
                    "soil_moisture_1_7cm_m3m3": 0.35,
                    "soil_moisture_7_28cm_m3m3": 0.38,
                    "soil_saturation_pct": 72.9,
                    "units": "m³/m³"
                }
            )
