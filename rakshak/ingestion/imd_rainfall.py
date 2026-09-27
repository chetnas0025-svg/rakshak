"""
IMD / Open-Meteo Rainfall Ingestion Adapter.
Fetches real-time and antecedent precipitation time-series for ward coordinates.
"""
import time
from typing import Optional
import httpx
from rakshak.config import settings
from rakshak.ingestion.base import BaseAdapter, AdapterHealthStatus, IngestionResult, logger


class RainfallAdapter(BaseAdapter):
    def __init__(self, base_url: Optional[str] = None, timeout_seconds: float = 8.0):
        super().__init__(name="IMD_Rainfall_Adapter", timeout_seconds=timeout_seconds)
        self.base_url = base_url or settings.OPEN_METEO_BASE_URL

    async def health_check(self) -> AdapterHealthStatus:
        start_time = time.perf_counter()
        try:
            async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
                # Ping with Mandi coordinates (31.7087, 76.9320)
                resp = await client.get(
                    f"{self.base_url}/forecast",
                    params={"latitude": 31.7087, "longitude": 76.9320, "hourly": "precipitation"}
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
            "hourly": "precipitation,rain",
            "past_days": 3,
            "forecast_days": 1,
            "timezone": "Asia/Kolkata"
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
                resp = await client.get(f"{self.base_url}/forecast", params=params)
                latency_ms = (time.perf_counter() - start_time) * 1000

                if resp.status_code == 200:
                    self.record_success(latency_ms)
                    payload = resp.json()
                    hourly_rain = payload.get("hourly", {}).get("precipitation", [])

                    # Parse 24h, 72h antecedent
                    rain_last_24h = sum(hourly_rain[-48:-24]) if len(hourly_rain) >= 48 else sum(hourly_rain[-24:])
                    rain_last_72h = sum(hourly_rain[:72]) if len(hourly_rain) >= 72 else sum(hourly_rain)
                    max_1h = max(hourly_rain[-24:]) if len(hourly_rain) >= 24 else (max(hourly_rain) if hourly_rain else 0.0)

                    return IngestionResult(
                        source_name=self.name,
                        is_successful=True,
                        status=self.status,
                        latency_ms=latency_ms,
                        is_live_data=True,
                        data={
                            "current_rainfall_24h": round(float(rain_last_24h), 2),
                            "antecedent_rainfall_72h": round(float(rain_last_72h), 2),
                            "max_intensity_1h": round(float(max_1h), 2),
                            "hourly_precipitation": hourly_rain[-24:],
                            "elevation_api": payload.get("elevation", None),
                            "units": payload.get("hourly_units", {}).get("precipitation", "mm")
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
            # Structured fallback with explicit flag: is_live_data=False
            return IngestionResult(
                source_name=self.name,
                is_successful=False,
                status=self.status,
                latency_ms=latency_ms,
                is_live_data=False,
                error_message=f"Live rainfall fetch failed: {str(e)}",
                data={
                    "current_rainfall_24h": 0.0,
                    "antecedent_rainfall_72h": 0.0,
                    "max_intensity_1h": 0.0,
                    "hourly_precipitation": [0.0] * 24,
                    "units": "mm"
                }
            )
