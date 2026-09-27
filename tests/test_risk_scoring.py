"""
Unit tests for Rakshak risk scoring, 8-factor feature schema,
and warning threshold transitions.
"""
import pytest
from rakshak.modeling.features import FeatureVector, FEATURE_NAMES, LITHOLOGY_MAP, LAND_COVER_MAP
from rakshak.modeling.explain import RiskExplainer
from rakshak.modeling.model_store import ModelStore
from rakshak.modeling.dataset import generate_temporal_dataset, HIMACHAL_WARDS


@pytest.fixture
def model_store():
    return ModelStore()


@pytest.fixture
def explainer(model_store):
    return RiskExplainer(model_store)


def test_feature_vector_validation():
    feat = FeatureVector(
        elevation=1450.0,
        slope=32.0,
        aspect=190.0,
        lithology=4,
        land_cover=2,
        ndvi=0.45,
        soil_type=3,
        rainfall_antecedent_72h=120.0,
        rainfall_current_24h=85.0
    )
    arr = feat.to_list()
    assert len(arr) == len(FEATURE_NAMES)
    d = feat.to_dict()
    assert d["lithology_name"] == LITHOLOGY_MAP[4]
    assert d["land_cover_name"] == LAND_COVER_MAP[2]


def test_risk_score_low_conditions(explainer):
    """Low rainfall and gentle slope must produce NORMAL/LOW alert."""
    feat = FeatureVector(
        elevation=650.0,
        slope=8.0,
        aspect=180.0,
        lithology=1,
        land_cover=1,
        ndvi=0.75,
        soil_type=1,
        rainfall_antecedent_72h=5.0,
        rainfall_current_24h=2.0
    )
    res = explainer.explain(feat)
    assert res["risk_score"] < 40.0
    assert res["alert_level"] == "NORMAL"
    assert res["alert_color"] == "#10b981"
    assert res["lead_time_hours"] >= 12.0


def test_risk_score_extreme_cloudburst(explainer):
    """Extreme 24h rainfall (>150mm) on steep slopes must trigger WARNING / RED emergency alert."""
    feat = FeatureVector(
        elevation=1800.0,
        slope=38.0,
        aspect=210.0,
        lithology=5,
        land_cover=5,
        ndvi=0.25,
        soil_type=4,
        rainfall_antecedent_72h=220.0,
        rainfall_current_24h=180.0
    )
    res = explainer.explain(feat)
    assert res["risk_score"] >= 80.0
    assert res["alert_level"] == "WARNING"
    assert res["alert_color"] == "#ef4444"
    assert res["lead_time_hours"] <= 4.0

    # Ensure factor contributions explain the surge
    top_factor = res["factor_contributions"][0]
    assert "rainfall" in top_factor["factor_name"]
    assert top_factor["impact_points"] > 0


def test_temporal_dataset_no_leakage():
    """Verify that training and holdout datasets have strict non-overlapping temporal windows."""
    df_train, df_test = generate_temporal_dataset()
    max_train_date = df_train["date"].max()
    min_test_date = df_test["date"].min()

    assert max_train_date < min_test_date
    assert max_train_date <= "2025-05-31"
    assert min_test_date >= "2025-06-01"


def test_himachal_wards_integrity():
    """Verify all 20 wards have valid geographical and topographical coordinates."""
    assert len(HIMACHAL_WARDS) >= 20
    districts = {w.district_name for w in HIMACHAL_WARDS}
    assert "Mandi" in districts
    assert "Kullu" in districts
    assert "Kangra" in districts

    for w in HIMACHAL_WARDS:
        assert 31.0 <= w.latitude <= 33.0
        assert 75.0 <= w.longitude <= 78.0
        assert 300.0 <= w.base_elevation <= 4000.0
        assert 5.0 <= w.base_slope <= 60.0
