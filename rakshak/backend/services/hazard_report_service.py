"""
Hazard Report Service for Rakshak.
Handles citizen and field-officer hazard report submissions, PostGIS/spatial ward matching,
rate-limiting, verification workflows, risk-boost computations (+15% / +25% priority),
and audit log logging for ward risk adjustments.
"""
import uuid
import math
import time
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional
from rakshak.backend.models.schemas import (
    SubmitReportRequest,
    VerifyReportRequest,
    HazardReportResponse,
    WardRiskAdjustmentRecord
)
from rakshak.backend.services.ward_registry import ward_registry
from rakshak.backend.services.risk_service import risk_service


class HazardReportService:
    def __init__(self):
        # Primary in-memory table store (mirrors PostgreSQL hazard_reports)
        self._reports: Dict[str, Dict[str, Any]] = {}
        # Audit log table (mirrors PostgreSQL ward_risk_adjustments)
        self._adjustments_audit_log: List[WardRiskAdjustmentRecord] = []
        # Rate-limiter tracker: ip_or_client -> list of timestamps
        self._rate_limit_tracker: Dict[str, List[float]] = {}
        
        # Seed initial realistic pending and verified sample reports
        self._seed_initial_reports()

    def _seed_initial_reports(self):
        now_dt = datetime.now(timezone.utc)
        rep1_id = "rep-001-thunag-crack"
        self._reports[rep1_id] = {
            "id": rep1_id,
            "ward_id": "HP-MND-02",
            "ward_name": "Thunag (Seraj Basin)",
            "district_name": "Mandi",
            "latitude": 31.5432,
            "longitude": 77.1650,
            "category": "crack",
            "photo_url": "https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?w=600&auto=format&fit=crop&q=80",
            "description": "4cm wide longitudinal tension crack along upper orchard slope road.",
            "reporter_type": "citizen",
            "reporter_contact": "+919816012345",
            "status": "verified",
            "verified_by": "OFFICER-NDRF-01",
            "verified_at": (now_dt - timedelta(hours=2)).isoformat(),
            "created_at": (now_dt - timedelta(hours=3)).isoformat(),
            "risk_boost_applied": True,
            "applied_boost_percent": 15.0
        }

        rep2_id = "rep-002-manikaran-seepage"
        self._reports[rep2_id] = {
            "id": rep2_id,
            "ward_id": "HP-KLU-01",
            "ward_name": "Manikaran (Parbati Valley)",
            "district_name": "Kullu",
            "latitude": 32.0289,
            "longitude": 77.3489,
            "category": "seepage",
            "photo_url": None,
            "description": "Muddy water seepage emerging from retaining wall foundation.",
            "reporter_type": "field_officer",
            "reporter_contact": "+919816099887",
            "status": "pending",
            "verified_by": None,
            "verified_at": None,
            "created_at": (now_dt - timedelta(minutes=45)).isoformat(),
            "risk_boost_applied": False,
            "applied_boost_percent": 0.0
        }

    def _find_nearest_ward_id(self, lat: float, lng: float) -> str:
        """Finds nearest ward using spatial centroid distance."""
        best_ward_id = "HP-MND-01"
        min_dist = float("inf")
        for ward in ward_registry.get_all_wards():
            dlat = math.radians(lat - ward.latitude)
            dlng = math.radians(lng - ward.longitude)
            dist = math.sqrt(dlat**2 + dlng**2)
            if dist < min_dist:
                min_dist = dist
                best_ward_id = ward.ward_id
        return best_ward_id

    def check_rate_limit(self, client_identifier: str = "default_client", limit: int = 10, window_seconds: int = 3600) -> bool:
        """Rate limit: Max 10 submissions per device/IP per hour."""
        now = time.time()
        timestamps = self._rate_limit_tracker.get(client_identifier, [])
        valid_timestamps = [t for t in timestamps if now - t < window_seconds]
        if len(valid_timestamps) >= limit:
            return False
        valid_timestamps.append(now)
        self._rate_limit_tracker[client_identifier] = valid_timestamps
        return True

    def submit_report(self, req: SubmitReportRequest, client_identifier: str = "default_client") -> HazardReportResponse:
        """Submits a new hazard report (default status: pending, risk_boost_applied: false)."""
        if not self.check_rate_limit(client_identifier):
            raise ValueError("Rate limit exceeded: Max 10 submissions per hour per device.")

        # Determine ward_id from explicit input or spatial nearest centroid
        target_ward_id = req.ward_id or self._find_nearest_ward_id(req.latitude, req.longitude)
        ward = ward_registry.get_ward_by_id(target_ward_id)
        ward_name = ward.ward_name if ward else "Local Mountain Basin"
        district_name = ward.district_name if ward else "Mandi"

        rep_id = f"rep-{uuid.uuid4().hex[:8]}"
        now_iso = datetime.now(timezone.utc).isoformat()

        report_dict = {
            "id": rep_id,
            "ward_id": target_ward_id,
            "ward_name": ward_name,
            "district_name": district_name,
            "latitude": req.latitude,
            "longitude": req.longitude,
            "category": req.category,
            "photo_url": req.photo_base64 if req.photo_base64 else None,
            "description": req.description,
            "reporter_type": req.reporter_type,
            "reporter_contact": req.reporter_contact,
            "status": "pending",
            "verified_by": None,
            "verified_at": None,
            "created_at": now_iso,
            "risk_boost_applied": False,
            "applied_boost_percent": 0.0
        }

        self._reports[rep_id] = report_dict
        return HazardReportResponse(**report_dict)

    def list_reports(self, ward_id: Optional[str] = None, status: Optional[str] = None) -> List[HazardReportResponse]:
        """Lists reports filtered by ward_id or status, sorted newest first."""
        res = list(self._reports.values())
        if ward_id:
            res = [r for r in res if r["ward_id"] == ward_id]
        if status:
            res = [r for r in res if r["status"] == status]

        res.sort(key=lambda x: x["created_at"], reverse=True)
        return [HazardReportResponse(**r) for r in res]

    def get_report_by_id(self, report_id: str) -> Optional[HazardReportResponse]:
        r = self._reports.get(report_id)
        return HazardReportResponse(**r) if r else None

    def verify_report(self, report_id: str, req: VerifyReportRequest) -> HazardReportResponse:
        """
        Field Officer Verification Workflow:
        On 'verify':
        1. Updates report status to 'verified'.
        2. Applies +15% boost to ward risk_score (capped at 100).
        3. If 3+ verified reports land in same ward within 6 hours, applies +25% priority boost path.
        4. Logs audit record to ward_risk_adjustments.
        On 'reject':
        Soft-deletes report by setting status to 'rejected' without risk boost.
        """
        report = self._reports.get(report_id)
        if not report:
            raise ValueError(f"Report ID '{report_id}' not found.")

        now_dt = datetime.now(timezone.utc)
        now_iso = now_dt.isoformat()

        if req.action == "reject":
            report["status"] = "rejected"
            report["verified_by"] = req.officer_id
            report["verified_at"] = now_iso
            return HazardReportResponse(**report)

        if req.action == "verify":
            report["status"] = "verified"
            report["verified_by"] = req.officer_id
            report["verified_at"] = now_iso

            # Trigger Risk-Boost Business Logic if not already applied
            if not report.get("risk_boost_applied"):
                ward_id = report["ward_id"]
                # Count recent verified reports in this ward within 6 hours
                six_hours_ago = now_dt - timedelta(hours=6)
                recent_verified_count = 0
                for r in self._reports.values():
                    if r["ward_id"] == ward_id and r["status"] == "verified":
                        v_time = datetime.fromisoformat(r["verified_at"].replace("Z", "+00:00")) if r.get("verified_at") else now_dt
                        if v_time >= six_hours_ago:
                            recent_verified_count += 1

                # If 3+ verified reports in 6h window -> Priority path +25% boost
                boost_pct = 25.0 if recent_verified_count >= 3 else 15.0

                # Fetch current ward risk from risk_service
                w_risk = risk_service.get_ward_risk(ward_id)
                prev_score = w_risk.risk_score if w_risk else 50.0

                # Calculate boosted risk score (capped at 100.0)
                boost_points = prev_score * (boost_pct / 100.0)
                new_score = min(100.0, prev_score + boost_points)

                # Recompute alert level / risk tier
                if new_score >= 80.0:
                    new_level = "WARNING"
                    new_color = "#ef4444"
                elif new_score >= 60.0:
                    new_level = "WATCH"
                    new_color = "#f97316"
                elif new_score >= 40.0:
                    new_level = "ADVISORY"
                    new_color = "#eab308"
                else:
                    new_level = "NORMAL"
                    new_color = "#10b981"

                # Update in-memory risk_service cache
                if w_risk:
                    w_risk.risk_score = round(new_score, 1)
                    w_risk.alert_level = new_level
                    w_risk.alert_color = new_color
                    risk_service._cache[ward_id] = w_risk

                report["risk_boost_applied"] = True
                report["applied_boost_percent"] = boost_pct

                # Log to ward_risk_adjustments audit table
                audit_rec = WardRiskAdjustmentRecord(
                    adjustment_id=f"adj-{uuid.uuid4().hex[:8]}",
                    ward_id=ward_id,
                    report_id=report_id,
                    previous_risk_score=prev_score,
                    boosted_risk_score=round(new_score, 1),
                    applied_boost_percent=boost_pct,
                    reason=f"citizen_report:{report_id} (Category: {report['category']}, Verification: {req.officer_id})",
                    timestamp=now_iso
                )
                self._adjustments_audit_log.append(audit_rec)

            return HazardReportResponse(**report)

        raise ValueError(f"Invalid action '{req.action}'. Expected 'verify' or 'reject'.")

    def get_audit_log(self) -> List[WardRiskAdjustmentRecord]:
        return self._adjustments_audit_log


hazard_report_service = HazardReportService()
