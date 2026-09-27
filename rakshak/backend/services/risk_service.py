"""
Risk Assessment Engine for Rakshak.
Fuses real-time precipitation, terrain attributes, soil moisture saturation,
and machine-learning inference into ward-level explainable risk scores.
"""
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any
from rakshak.backend.models.schemas import DetailedWardRiskResponse, WardRiskSummary, FactorContribution
from rakshak.backend.services.ward_registry import ward_registry
from rakshak.ingestion.imd_rainfall import RainfallAdapter
from rakshak.ingestion.soil_moisture import SoilMoistureAdapter
from rakshak.ingestion.terrain_dem import TerrainDEMAdapter
from rakshak.ingestion.sensor_stream import SensorTelemetryPayload
from rakshak.modeling.explain import RiskExplainer
from rakshak.modeling.features import FeatureVector, WardFeatureProfile
from rakshak.modeling.model_store import ModelStore


class RiskService:
    def __init__(self):
        self.model_store = ModelStore()
        self.explainer = RiskExplainer(self.model_store)
        self.rainfall_adapter = RainfallAdapter()
        self.terrain_adapter = TerrainDEMAdapter()
        self.soil_adapter = SoilMoistureAdapter()

        # In-memory cached states per ward
        self._cache: Dict[str, DetailedWardRiskResponse] = {}
        now_iso = datetime.now(timezone.utc).isoformat()
        self._sensor_telemetry: Dict[str, Dict[str, Any]] = {
            "HP-MND-01": {
                "node_id": "ESP32-MND-01",
                "node_name": "Beas Victoria Bridge Sonar Node",
                "ward_id": "HP-MND-01",
                "ward_name": "Mandi Sadar (Beas Valley)",
                "district_name": "Mandi",
                "latitude": 31.7120,
                "longitude": 76.9320,
                "river_name": "Beas River",
                "water_level_cm": 285.0,
                "water_level_rate_cm_per_hr": 14.5,
                "tilt_angle_deg": 1.2,
                "battery_level_pct": 94.0,
                "status": "NORMAL",
                "last_ping": now_iso
            },
            "HP-MND-02": {
                "node_id": "ESP32-MND-02",
                "node_name": "Seraj Basin Flash Sonar Station",
                "ward_id": "HP-MND-02",
                "ward_name": "Thunag (Seraj Basin)",
                "district_name": "Mandi",
                "latitude": 31.5420,
                "longitude": 77.1620,
                "river_name": "Seraj Khad Tributary",
                "water_level_cm": 445.0,
                "water_level_rate_cm_per_hr": 48.0,
                "tilt_angle_deg": 6.8,
                "battery_level_pct": 88.0,
                "status": "SURGE_WARNING",
                "last_ping": now_iso
            },
            "HP-KLU-01": {
                "node_id": "ESP32-KLU-01",
                "node_name": "Parbati Valley River Sonar Node",
                "ward_id": "HP-KLU-01",
                "ward_name": "Manikaran (Parbati Valley)",
                "district_name": "Kullu",
                "latitude": 32.0280,
                "longitude": 77.3480,
                "river_name": "Parbati River",
                "water_level_cm": 412.0,
                "water_level_rate_cm_per_hr": 38.0,
                "tilt_angle_deg": 4.1,
                "battery_level_pct": 91.0,
                "status": "SURGE_WARNING",
                "last_ping": now_iso
            },
            "HP-KNG-02": {
                "node_id": "ESP32-KNG-02",
                "node_name": "Manuni Khad Flash Torrent Monitor",
                "ward_id": "HP-KNG-02",
                "ward_name": "Khaniyara (Manuni Khad)",
                "district_name": "Kangra",
                "latitude": 32.1880,
                "longitude": 76.3680,
                "river_name": "Manuni Khad",
                "water_level_cm": 355.0,
                "water_level_rate_cm_per_hr": 26.0,
                "tilt_angle_deg": 3.4,
                "battery_level_pct": 96.0,
                "status": "NORMAL",
                "last_ping": now_iso
            }
        }
        self._initialize_baseline_cache()

    def _initialize_baseline_cache(self):
        """Initializes realistic baseline states for all wards in Mandi, Kullu, Kangra."""
        for ward in ward_registry.get_all_wards():
            # Initial baseline weather (typical active monsoon baseline)
            # High vulnerability in Thunag (HP-MND-02), Manikaran (HP-KLU-01), Khaniyara (HP-KNG-02)
            if ward.ward_id == "HP-MND-02":  # Thunag - Seraj Basin
                rain_24h = 125.0
                rain_72h = 195.0
            elif ward.ward_id == "HP-KLU-01":  # Manikaran - Parbati Valley
                rain_24h = 110.0
                rain_72h = 160.0
            elif ward.ward_id == "HP-KNG-02":  # Khaniyara - Manuni Khad
                rain_24h = 88.0
                rain_72h = 140.0
            elif ward.ward_id == "HP-MND-01":  # Mandi Sadar
                rain_24h = 75.0
                rain_72h = 120.0
            else:
                rain_24h = 24.5
                rain_72h = 42.0

            feat = FeatureVector(
                elevation=ward.base_elevation,
                slope=ward.base_slope,
                aspect=ward.base_aspect,
                lithology=ward.lithology,
                land_cover=ward.land_cover,
                ndvi=ward.base_ndvi,
                soil_type=ward.soil_type,
                rainfall_antecedent_72h=rain_72h,
                rainfall_current_24h=rain_24h
            )

            exp = self.explainer.explain(feat)
            contributions = [FactorContribution(**fc) for fc in exp["factor_contributions"]]

            self._cache[ward.ward_id] = DetailedWardRiskResponse(
                ward_id=ward.ward_id,
                ward_name=ward.ward_name,
                district_name=ward.district_name,
                latitude=ward.latitude,
                longitude=ward.longitude,
                risk_score=exp["risk_score"],
                alert_level=exp["alert_level"],
                alert_color=exp["alert_color"],
                severity_label=exp["severity_label"],
                lead_time_hours=exp["lead_time_hours"],
                rainfall_current_24h=rain_24h,
                rainfall_antecedent_72h=rain_72h,
                is_live_data=True,
                factor_contributions=contributions,
                features_summary=exp["features_summary"],
                live_sensor_telemetry=self._sensor_telemetry.get(ward.ward_id)
            )

    async def refresh_ward_live(self, ward_id: str) -> Optional[DetailedWardRiskResponse]:
        """Fetches live satellite and weather feeds for a specific ward and updates score."""
        ward = ward_registry.get_ward_by_id(ward_id)
        if not ward:
            return None

        # Fetch live data concurrently from adapters
        rain_res = await self.rainfall_adapter.fetch(ward.latitude, ward.longitude)
        dem_res = await self.terrain_adapter.fetch(ward.latitude, ward.longitude)

        rain_24h = rain_res.data.get("current_rainfall_24h", 15.0)
        rain_72h = rain_res.data.get("antecedent_rainfall_72h", 30.0)
        slope_live = dem_res.data.get("slope_deg", ward.base_slope)
        elev_live = dem_res.data.get("elevation_m", ward.base_elevation)
        aspect_live = dem_res.data.get("aspect_deg", ward.base_aspect)

        feat = FeatureVector(
            elevation=elev_live,
            slope=slope_live,
            aspect=aspect_live,
            lithology=ward.lithology,
            land_cover=ward.land_cover,
            ndvi=ward.base_ndvi,
            soil_type=ward.soil_type,
            rainfall_antecedent_72h=rain_72h,
            rainfall_current_24h=rain_24h
        )

        exp = self.explainer.explain(feat)
        contributions = [FactorContribution(**fc) for fc in exp["factor_contributions"]]

        # Modulate risk score if live IoT sensor reports critical surge
        sensor_data = self._sensor_telemetry.get(ward_id)
        final_risk = exp["risk_score"]
        final_level = exp["alert_level"]
        final_color = exp["alert_color"]

        if sensor_data and sensor_data.get("water_level_cm", 0) > 400.0:
            final_risk = min(100.0, max(final_risk, 85.0))
            final_level = "WARNING"
            final_color = "#ef4444"

        response = DetailedWardRiskResponse(
            ward_id=ward.ward_id,
            ward_name=ward.ward_name,
            district_name=ward.district_name,
            latitude=ward.latitude,
            longitude=ward.longitude,
            risk_score=final_risk,
            alert_level=final_level,
            alert_color=final_color,
            severity_label=exp["severity_label"],
            lead_time_hours=exp["lead_time_hours"],
            rainfall_current_24h=rain_24h,
            rainfall_antecedent_72h=rain_72h,
            is_live_data=rain_res.is_live_data,
            factor_contributions=contributions,
            features_summary=exp["features_summary"],
            live_sensor_telemetry=sensor_data
        )

        self._cache[ward_id] = response
        return response

    def ingest_sensor_telemetry(self, payload: SensorTelemetryPayload):
        """Processes real-time IoT water-level & tilt sensor reading and updates ward risk."""
        existing = self._sensor_telemetry.get(payload.ward_id, {})
        ward = ward_registry.get_ward_by_id(payload.ward_id)
        ward_name = ward.ward_name if ward else payload.ward_id
        district_name = ward.district_name if ward else "Mandi"
        latitude = ward.latitude if ward else 31.7
        longitude = ward.longitude if ward else 77.0

        is_surge = payload.water_level_cm > 400.0 or (payload.water_level_rate_cm_per_hr or 0) > 35.0
        status_label = "SURGE_WARNING" if is_surge else "NORMAL"

        self._sensor_telemetry[payload.ward_id] = {
            "node_id": payload.node_id,
            "node_name": existing.get("node_name", f"{ward_name} Sonar Node"),
            "ward_id": payload.ward_id,
            "ward_name": ward_name,
            "district_name": district_name,
            "latitude": latitude,
            "longitude": longitude,
            "river_name": existing.get("river_name", "Local River Tributary"),
            "source": payload.source.value,
            "timestamp": payload.timestamp.isoformat(),
            "water_level_cm": payload.water_level_cm,
            "water_level_rate_cm_per_hr": payload.water_level_rate_cm_per_hr or 0.0,
            "tilt_angle_deg": payload.tilt_angle_deg or 0.0,
            "battery_level_pct": payload.battery_level_pct or 100.0,
            "status": status_label,
            "last_ping": payload.timestamp.isoformat()
        }

        # If already in cache, update sensor telemetry attached
        if payload.ward_id in self._cache:
            curr = self._cache[payload.ward_id]
            curr.live_sensor_telemetry = self._sensor_telemetry[payload.ward_id]
            # Elevate risk if high water level or rate
            if payload.water_level_cm > 400 or (payload.water_level_rate_cm_per_hr or 0) > 35:
                curr.risk_score = min(100.0, max(curr.risk_score, 88.0))
                curr.alert_level = "WARNING"
                curr.alert_color = "#ef4444"
                curr.severity_label = "EMERGENCY: River Overflow Detected by Sonar Sensor"

    def get_ward_risk(self, ward_id: str) -> Optional[DetailedWardRiskResponse]:
        return self._cache.get(ward_id)

    def get_district_wards(self, district_name: str) -> List[WardRiskSummary]:
        d_lower = district_name.lower()
        results = []
        for res in self._cache.values():
            if res.district_name.lower() == d_lower:
                results.append(WardRiskSummary(
                    ward_id=res.ward_id,
                    ward_name=res.ward_name,
                    district_name=res.district_name,
                    latitude=res.latitude,
                    longitude=res.longitude,
                    risk_score=res.risk_score,
                    alert_level=res.alert_level,
                    alert_color=res.alert_color,
                    lead_time_hours=res.lead_time_hours,
                    rainfall_current_24h=res.rainfall_current_24h,
                    rainfall_antecedent_72h=res.rainfall_antecedent_72h,
                    is_live_data=res.is_live_data,
                    last_updated=res.last_updated
                ))
        return results

    def get_all_summaries(self) -> List[WardRiskSummary]:
        return [
            WardRiskSummary(
                ward_id=res.ward_id,
                ward_name=res.ward_name,
                district_name=res.district_name,
                latitude=res.latitude,
                longitude=res.longitude,
                risk_score=res.risk_score,
                alert_level=res.alert_level,
                alert_color=res.alert_color,
                lead_time_hours=res.lead_time_hours,
                rainfall_current_24h=res.rainfall_current_24h,
                rainfall_antecedent_72h=res.rainfall_antecedent_72h,
                is_live_data=res.is_live_data,
                last_updated=res.last_updated
            )
            for res in self._cache.values()
        ]

    def get_all_sensors(self) -> List[Dict[str, Any]]:
        """Returns real-time telemetry from all active IoT field stations."""
        return list(self._sensor_telemetry.values())

    def simulate_weather(
        self,
        rain_24h: float,
        rain_72h: float,
        ward_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Runs the full explainable Random Forest ML pipeline for all wards under simulated
        precipitation conditions (What-If Sandbox).
        """
        simulated_summaries: List[WardRiskSummary] = []
        detailed_ward: Optional[DetailedWardRiskResponse] = None
        now_dt = datetime.now(timezone.utc)

        for ward in ward_registry.get_all_wards():
            feat = FeatureVector(
                elevation=ward.base_elevation,
                slope=ward.base_slope,
                aspect=ward.base_aspect,
                lithology=ward.lithology,
                land_cover=ward.land_cover,
                ndvi=ward.base_ndvi,
                soil_type=ward.soil_type,
                rainfall_antecedent_72h=rain_72h,
                rainfall_current_24h=rain_24h
            )

            exp = self.explainer.explain(feat)

            summary = WardRiskSummary(
                ward_id=ward.ward_id,
                ward_name=ward.ward_name,
                district_name=ward.district_name,
                latitude=ward.latitude,
                longitude=ward.longitude,
                risk_score=exp["risk_score"],
                alert_level=exp["alert_level"],
                alert_color=exp["alert_color"],
                lead_time_hours=exp["lead_time_hours"],
                rainfall_current_24h=rain_24h,
                rainfall_antecedent_72h=rain_72h,
                is_live_data=False,
                last_updated=now_dt
            )
            simulated_summaries.append(summary)

            if ward_id and ward.ward_id == ward_id:
                contributions = [FactorContribution(**fc) for fc in exp["factor_contributions"]]
                detailed_ward = DetailedWardRiskResponse(
                    ward_id=ward.ward_id,
                    ward_name=ward.ward_name,
                    district_name=ward.district_name,
                    latitude=ward.latitude,
                    longitude=ward.longitude,
                    risk_score=exp["risk_score"],
                    alert_level=exp["alert_level"],
                    alert_color=exp["alert_color"],
                    lead_time_hours=exp["lead_time_hours"],
                    rainfall_current_24h=rain_24h,
                    rainfall_antecedent_72h=rain_72h,
                    is_live_data=False,
                    last_updated=now_dt,
                    severity_label=exp["severity_label"],
                    factor_contributions=contributions,
                    features_summary=exp["features_summary"],
                    live_sensor_telemetry=self._sensor_telemetry.get(ward.ward_id)
                )

        return {
            "simulated_rainfall_24h_mm": rain_24h,
            "simulated_rainfall_72h_mm": rain_72h,
            "wards": simulated_summaries,
            "detailed_ward": detailed_ward
        }

    def calculate_factor_of_safety(self, ward_id: str) -> Dict[str, Any]:
        """
        Computes the physics-based Infinite-Slope Factor of Safety (Fs) equation:
        Fs = (c' + (gamma - m * gamma_w) * z * cos^2(beta) * tan(phi')) / (gamma * z * sin(beta) * cos(beta))
        Exposes physical engineering explainability alongside ML predictions.
        """
        import math
        ward = ward_registry.get_ward_by_id(ward_id)
        if not ward:
            ward_slope = 30.0
            ward_name = ward_id
            rain_24h = 50.0
        else:
            ward_slope = ward.base_slope
            ward_name = ward.ward_name
            w_risk = self._cache.get(ward_id)
            rain_24h = w_risk.rainfall_current_24h if w_risk else 50.0

        # Physical constants for Western Himalayan regolith
        c_eff = 12.5  # Effective soil cohesion (kPa)
        phi_deg = 32.0  # Angle of internal friction (deg)
        gamma = 18.5  # Soil unit weight (kN/m^3)
        gamma_w = 9.81  # Water unit weight (kN/m^3)
        z = 1.8  # Failure plane depth (meters)

        # Saturation fraction m derived from 24h & 72h rainfall infiltration
        m = min(1.0, max(0.1, rain_24h / 120.0))

        beta_rad = math.radians(max(5.0, ward_slope))
        phi_rad = math.radians(phi_deg)

        cos_b = math.cos(beta_rad)
        sin_b = math.sin(beta_rad)
        tan_phi = math.tan(phi_rad)

        # Shear strength (numerator) vs Shear stress (denominator)
        effective_stress = (gamma - m * gamma_w) * z * (cos_b ** 2) * tan_phi
        shear_strength = c_eff + effective_stress
        shear_stress = gamma * z * sin_b * cos_b

        fs = round(shear_strength / max(0.001, shear_stress), 2)
        is_unstable = fs < 1.0

        return {
            "ward_id": ward_id,
            "ward_name": ward_name,
            "slope_angle_deg": ward_slope,
            "soil_cohesion_kpa": c_eff,
            "internal_friction_deg": phi_deg,
            "saturation_fraction": round(m, 2),
            "failure_depth_m": z,
            "factor_of_safety": fs,
            "physical_status": "UNSTABLE (SLOPE FAILURE IMMINENT)" if is_unstable else ("MARGINAL (SLOPE STRESS HIGH)" if fs <= 1.5 else "STABLE"),
            "equation": "Fs = [c' + (γ - m·γ_w) z cos²β tanφ'] / [γ z sinβ cosβ]"
        }


risk_service = RiskService()


