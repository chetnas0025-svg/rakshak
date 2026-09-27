"""
Common Alerting Protocol (CAP-India / OASIS CAP v1.2) Service.
Generates standardized XML and JSON emergency broadcast payloads
adopted by the National Disaster Management Authority (NDMA) and SACHET platform.
"""
from datetime import datetime, timezone
import xml.etree.ElementTree as ET
from typing import List, Dict, Any


class CAPService:
    """Generates NDMA-compliant OASIS CAP v1.2 alerts."""

    def generate_cap_dict(self, active_warnings: List[Dict[str, Any]]) -> Dict[str, Any]:
        now = datetime.now(timezone.utc).isoformat()
        identifier = f"NDRF-HP-FLS-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}"

        info_items = []
        for ward in active_warnings:
            info_items.append({
                "language": "en-IN",
                "category": "Met",
                "event": "Flash Flood Threat",
                "urgency": "Immediate" if ward.get("risk_score", 0) > 75 else "Expected",
                "severity": "Extreme" if ward.get("risk_score", 0) > 75 else "Severe",
                "certainty": "Observed" if ward.get("risk_score", 0) > 75 else "Likely",
                "eventCode": [{"valueName": "SAME", "value": "FFW"}],
                "effective": now,
                "headline": f"Flash Flood Alert for {ward.get('ward_name', 'Ward')} (District: {ward.get('district_name', 'HP')})",
                "description": (
                    f"Hydrological early warning models indicate critical flash flood risk in {ward.get('ward_name')}. "
                    f"Composite Risk Index: {ward.get('risk_score', 0)}/100. "
                    f"Actionable lead time before peak surge: {ward.get('lead_time_hours', 3.0)} hours."
                ),
                "instruction": "Initiate emergency early warning broadcast. Restrict movement across low-lying bridges and riverbanks. Alert State Emergency Operation Centre (SEOC).",
                "area": {
                    "areaDesc": f"{ward.get('ward_name')}, {ward.get('district_name')}, Himachal Pradesh",
                    "circle": f"{ward.get('latitude', 31.7)},{ward.get('longitude', 76.9)},5.0"
                }
            })

        return {
            "alert": {
                "identifier": identifier,
                "sender": "ndrf.rakshak.eoc@gov.in",
                "sent": now,
                "status": "Actual",
                "msgType": "Alert",
                "scope": "Public",
                "code": ["IPAWS-CAP-1.2", "NDMA-SACHET-v1"],
                "info": info_items
            }
        }

    def generate_cap_xml(self, active_warnings: List[Dict[str, Any]]) -> str:
        data = self.generate_cap_dict(active_warnings)
        alert = data["alert"]

        root = ET.Element("alert", xmlns="urn:oasis:names:tc:emergency:cap:1.2")
        ET.SubElement(root, "identifier").text = alert["identifier"]
        ET.SubElement(root, "sender").text = alert["sender"]
        ET.SubElement(root, "sent").text = alert["sent"]
        ET.SubElement(root, "status").text = alert["status"]
        ET.SubElement(root, "msgType").text = alert["msgType"]
        ET.SubElement(root, "scope").text = alert["scope"]
        
        for c in alert["code"]:
            ET.SubElement(root, "code").text = c

        for info_data in alert["info"]:
            info = ET.SubElement(root, "info")
            ET.SubElement(info, "language").text = info_data["language"]
            ET.SubElement(info, "category").text = info_data["category"]
            ET.SubElement(info, "event").text = info_data["event"]
            ET.SubElement(info, "urgency").text = info_data["urgency"]
            ET.SubElement(info, "severity").text = info_data["severity"]
            ET.SubElement(info, "certainty").text = info_data["certainty"]
            ET.SubElement(info, "headline").text = info_data["headline"]
            ET.SubElement(info, "description").text = info_data["description"]
            ET.SubElement(info, "instruction").text = info_data["instruction"]

            area = ET.SubElement(info, "area")
            ET.SubElement(area, "areaDesc").text = info_data["area"]["areaDesc"]
            ET.SubElement(area, "circle").text = info_data["area"]["circle"]

        return ET.tostring(root, encoding="utf-8", xml_declaration=True).decode("utf-8")


cap_service = CAPService()
