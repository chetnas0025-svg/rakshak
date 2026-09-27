"""
Unit tests for Citizen Hazard Reporting feature (SIH26192).
Tests report submission, pending status 0% risk impact, officer verification +15% boost,
3+ verified reports +25% priority boost, and API endpoint flows.
"""
import pytest
from fastapi.testclient import TestClient
from rakshak.backend.main import app
from rakshak.backend.services.hazard_report_service import hazard_report_service
from rakshak.backend.services.risk_service import risk_service
from rakshak.backend.models.schemas import SubmitReportRequest, VerifyReportRequest

client = TestClient(app)


def test_submit_report_creates_pending_with_zero_risk_impact():
    """Unit test: submitting a report creates a pending row and does NOT change ward_risk.risk_score."""
    # Get baseline risk for HP-MND-01
    baseline = risk_service.get_ward_risk("HP-MND-01")
    initial_score = baseline.risk_score

    req = SubmitReportRequest(
        category="crack",
        latitude=31.7087,
        longitude=76.9320,
        ward_id="HP-MND-01",
        description="Test tension crack observation",
        reporter_type="citizen",
        reporter_contact="+919876543210"
    )

    report = hazard_report_service.submit_report(req, client_identifier="test_client_1")
    assert report.status == "pending"
    assert report.risk_boost_applied is False
    assert report.applied_boost_percent == 0.0

    # Verify risk score is completely unchanged
    after_submit = risk_service.get_ward_risk("HP-MND-01")
    assert after_submit.risk_score == initial_score


def test_verifying_report_boosts_risk_score_by_15_percent():
    """Unit test: verifying a report boosts risk_score by 15% and updates risk tier correctly."""
    # Submit report for HP-MND-04
    w_before = risk_service.get_ward_risk("HP-MND-04")
    prev_score = w_before.risk_score

    req = SubmitReportRequest(
        category="seepage",
        latitude=31.6705,
        longitude=77.0392,
        ward_id="HP-MND-04",
        description="Muddy seepage at slope base",
        reporter_type="field_officer"
    )
    report = hazard_report_service.submit_report(req, client_identifier="test_client_2")

    # Verify report
    v_req = VerifyReportRequest(action="verify", officer_id="OFFICER-TEST-01")
    verified = hazard_report_service.verify_report(report.id, v_req)

    assert verified.status == "verified"
    assert verified.risk_boost_applied is True
    assert verified.applied_boost_percent == 15.0

    # Check boosted risk score
    w_after = risk_service.get_ward_risk("HP-MND-04")
    expected_score = min(100.0, prev_score + (prev_score * 0.15))
    assert w_after.risk_score == round(expected_score, 1)


def test_three_verified_reports_trigger_25_percent_priority_boost():
    """Unit test: 3 verified reports in one ward within 6 hours trigger the +25% priority path."""
    ward_id = "HP-KNG-03"
    w_initial = risk_service.get_ward_risk(ward_id)
    start_score = w_initial.risk_score

    # Submit and verify 3 independent reports
    for i in range(3):
        sub_req = SubmitReportRequest(
            category="rockfall",
            latitude=32.2281,
            longitude=76.1736,
            ward_id=ward_id,
            description=f"Rockfall observation {i+1}",
            reporter_type="citizen"
        )
        rep = hazard_report_service.submit_report(sub_req, client_identifier=f"client_p_{i}")
        hazard_report_service.verify_report(rep.id, VerifyReportRequest(action="verify", officer_id="OFFICER-TEST"))

    # The 3rd verified report should trigger +25% priority path
    audit = hazard_report_service.get_audit_log()
    priority_records = [a for a in audit if a.ward_id == ward_id and a.applied_boost_percent == 25.0]
    assert len(priority_records) >= 1


def test_api_submit_and_verify_flow():
    """Integration test: API endpoints submit -> verify -> list reports."""
    # Submit via HTTP API
    resp = client.post("/api/v1/reports/submit", json={
        "category": "water_rising",
        "latitude": 31.7087,
        "longitude": 76.9320,
        "ward_id": "HP-MND-01",
        "description": "API Test Water Level Surge",
        "reporter_type": "citizen"
    })
    assert resp.status_code == 201
    rep_data = resp.json()
    rep_id = rep_data["id"]
    assert rep_data["status"] == "pending"

    # Verify via HTTP API
    patch_resp = client.patch(f"/api/v1/reports/{rep_id}/verify", json={
        "action": "verify",
        "officer_id": "NDRF-OFFICER-44"
    })
    assert patch_resp.status_code == 200
    patched_data = patch_resp.json()
    assert patched_data["status"] == "verified"
    assert patched_data["risk_boost_applied"] is True

    # List reports via API
    list_resp = client.get("/api/v1/reports?status=verified")
    assert list_resp.status_code == 200
    listed = list_resp.json()
    assert any(r["id"] == rep_id for r in listed)
