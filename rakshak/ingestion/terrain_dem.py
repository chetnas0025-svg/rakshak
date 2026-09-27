"""
Terrain DEM Adapter (SRTM 30m resolution proxy).
Fetches digital elevation and calculates slope and aspect for ward coordinates.
Uses Open-Elevation / SRTM grid queries with geometric gradient computation.
"""
import math
import time
from typing import Dict, Optional, Tuple
import httpx
from rakshak.config import settings
from rakshak.ingestion.base import BaseAdapter, AdapterHealthStatus, IngestionResult


class TerrainDEMAdapter(BaseAdapter):
    def __init__(self, base_url: Optional[str] = None, timeout_seconds: float = 8.0):
        super().__init__(name="SRTM_DEM_Terrain_Adapter", timeout_seconds=timeout_seconds)
        self.base_url = base_url or settings.OPEN_ELEVATION_BASE_URL

    async def health_check(self) -> AdapterHealthStatus:
        start_time = time.perf_counter()
        try:
            async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
                resp = await client.get(
                    f"{self.base_url}/lookup",
                    params={"locations": "31.7087,76.9320"}
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
        """
        Queries center point and cardinal offsets (~100m) to calculate local slope (degrees)
        and aspect (degrees 0-360).
        """
        start_time = time.perf_counter()
        # Offset ~100 meters: delta_lat ~ 0.0009 deg, delta_lon ~ 0.001 deg
        d_lat = 0.0009
        d_lon = 0.0010

        locs = f"{lat},{lon}|{lat + d_lat},{lon}|{lat - d_lat},{lon}|{lat},{lon + d_lon}|{lat},{lon - d_lon}"
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
                resp = await client.get(f"{self.base_url}/lookup", params={"locations": locs})
                latency_ms = (time.perf_counter() - start_time) * 1000

                if resp.status_code == 200:
                    self.record_success(latency_ms)
                    results = resp.json().get("results", [])
                    if len(results) >= 5:
                        z_center = results[0]["elevation"]
                        z_north = results[1]["elevation"]
                        z_south = results[2]["elevation"]
                        z_east = results[3]["elevation"]
                        z_west = results[4]["elevation"]

                        # Gradient calculation (Horn's method approximation for 100m spacing)
                        dx = 200.0  # West to East distance in meters
                        dy = 200.0  # South to North distance in meters
                        dz_dx = (z_east - z_west) / dx
                        dz_dy = (z_north - z_south) / dy

                        slope_rad = math.atan(math.sqrt(dz_dx**2 + dz_dy**2))
                        slope_deg = math.degrees(slope_rad)

                        aspect_rad = math.atan2(dz_dy, -dz_dx)
                        aspect_deg = (math.degrees(aspect_rad) + 360) % 360

                        return IngestionResult(
                            source_name=self.name,
                            is_successful=True,
                            status=self.status,
                            latency_ms=latency_ms,
                            is_live_data=True,
                            data={
                                "elevation_m": round(float(z_center), 1),
                                "slope_deg": round(float(slope_deg), 2),
                                "aspect_deg": round(float(aspect_deg), 1),
                                "resolution": "SRTM 30m / 100m grid"
                            }
                        )

            # Fallback if less than 5 points returned
            raise ValueError("Incomplete elevation points returned")

        except Exception as e:
            self.record_failure(e)
            latency_ms = (time.perf_counter() - start_time) * 1000
            # Geographically realistic baseline for Himachal Pradesh (Mandi/Kullu/Kangra valley floor to ridges)
            return IngestionResult(
                source_name=self.name,
                is_successful=False,
                status=self.status,
                latency_ms=latency_ms,
                is_live_data=False,
                error_message=f"DEM elevation fetch failed: {str(e)}",
                data={
                    "elevation_m": 1250.0,
                    "slope_deg": 28.5,
                    "aspect_deg": 180.0,
                    "resolution": "Fallback default terrain profile"
                }
            )
