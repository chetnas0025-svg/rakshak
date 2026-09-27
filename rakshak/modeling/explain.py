"""
Model Explainability and Risk Scoring Service for Rakshak.
Computes composite flood risk (0 - 100), alert levels, feature contributions,
and estimated warning lead times.
"""
from typing import Dict, Any, List
import numpy as np
from rakshak.modeling.features import FEATURE_NAMES, FeatureVector
from rakshak.modeling.model_store import ModelStore


class RiskExplainer:
    def __init__(self, model_store: ModelStore):
        self.model_store = model_store
        self.model = self.model_store.load_model()
        self.meta = self.model_store.load_metadata()

    def explain(self, features: FeatureVector) -> Dict[str, Any]:
        """
        Computes the probabilistic risk score and explains individual factor contributions.
        """
        feature_values = np.array([features.to_list()])

        if self.model is not None:
            # Random Forest probability of class 1 (flood)
            prob_flood = float(self.model.predict_proba(feature_values)[0, 1])
        else:
            # Deterministic empirical fallback if model weights not yet generated
            slope_w = min(1.0, features.slope / 45.0) * 0.25
            rain24_w = min(1.0, features.rainfall_current_24h / 120.0) * 0.35
            rain72_w = min(1.0, features.rainfall_antecedent_72h / 180.0) * 0.20
            litho_w = (features.lithology / 5.0) * 0.10
            veg_w = max(0.0, 1.0 - features.ndvi) * 0.10
            prob_flood = min(1.0, slope_w + rain24_w + rain72_w + litho_w + veg_w)

        # Early-warning calibrated risk index (0 - 100)
        # Decision boundary (prob >= 0.50) maps directly to WARNING (>80)
        if prob_flood >= 0.50:
            risk_score = round(80.0 + min(20.0, (prob_flood - 0.50) / 0.50 * 20.0), 1)
        elif prob_flood >= 0.30:
            risk_score = round(60.0 + ((prob_flood - 0.30) / 0.20) * 19.5, 1)
        elif prob_flood >= 0.15:
            risk_score = round(40.0 + ((prob_flood - 0.15) / 0.15) * 19.5, 1)
        else:
            risk_score = round((prob_flood / 0.15) * 39.0, 1)

        # Classify alert level
        if risk_score >= 80.0:
            alert_level = "WARNING"
            alert_color = "#ef4444"  # Red
            severity_label = "CRITICAL: Imminent Flash Flood Hazard"
        elif risk_score >= 60.0:
            alert_level = "WATCH"
            alert_color = "#f97316"  # Orange
            severity_label = "WATCH: Flash Flood Likely, Prepare Response"
        elif risk_score >= 40.0:
            alert_level = "ADVISORY"
            alert_color = "#eab308"  # Yellow
            severity_label = "ADVISORY: Elevated Infiltration & Saturated Terrain"
        else:
            alert_level = "NORMAL"
            alert_color = "#10b981"  # Green
            severity_label = "NORMAL: Safe Baseline Hydrological Conditions"

        # Explain factor contributions (normalized to percentage points of risk score)
        # Using feature importances as baseline weights modulated by actual feature values
        importances = self.meta.get("feature_importances", {}) if self.meta else {}
        
        # Physical factor ratios (how close each is to a danger threshold)
        ratios = {
            "rainfall_current_24h": min(2.5, features.rainfall_current_24h / 70.0),
            "rainfall_antecedent_72h": min(2.0, features.rainfall_antecedent_72h / 130.0),
            "slope": min(1.8, features.slope / 30.0),
            "lithology": features.lithology / 3.0,
            "soil_type": features.soil_type / 2.5,
            "elevation": min(1.5, features.elevation / 1500.0),
            "land_cover": features.land_cover / 3.0,
            "ndvi": max(0.2, (1.0 - features.ndvi) / 0.5)
        }

        contributions: List[Dict[str, Any]] = []
        raw_contribs = {}
        for feat in FEATURE_NAMES:
            imp = importances.get(feat, 0.12)
            ratio = ratios.get(feat, 1.0)
            raw_contribs[feat] = imp * ratio

        total_contrib = sum(raw_contribs.values()) or 1.0
        for feat in FEATURE_NAMES:
            pct_share = (raw_contribs[feat] / total_contrib) * risk_score
            contributions.append({
                "factor_name": feat,
                "display_name": feat.replace("_", " ").title(),
                "impact_points": round(pct_share, 1),
                "is_aggravating": raw_contribs[feat] > 0.15
            })

        contributions.sort(key=lambda x: x["impact_points"], reverse=True)

        # Estimate actionable lead time (hours)
        if risk_score > 75.0:
            lead_time_hours = max(1.5, round(6.0 - (features.rainfall_current_24h / 50.0), 1))
        elif risk_score > 50.0:
            lead_time_hours = max(4.0, round(12.0 - (features.rainfall_current_24h / 25.0), 1))
        else:
            lead_time_hours = 24.0

        return {
            "risk_score": risk_score,
            "alert_level": alert_level,
            "alert_color": alert_color,
            "severity_label": severity_label,
            "lead_time_hours": lead_time_hours,
            "factor_contributions": contributions,
            "features_summary": features.to_dict()
        }
