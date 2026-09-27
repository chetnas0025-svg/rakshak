"""
Console / Mock Notification Provider implementation.
Logs structured SMS alerts to console and audit records.
Ensures 100% reliable judging-day execution without requiring third-party API keys.
"""
import uuid
from typing import List
from rakshak.messaging.provider import BaseNotificationProvider, AlertDispatchRecord, logger


class ConsoleNotificationProvider(BaseNotificationProvider):
    def __init__(self):
        super().__init__(name="Console_Mock_Provider")

    async def send_alert(
        self,
        recipients: List[str],
        ward_id: str,
        ward_name: str,
        risk_score: float,
        alert_level: str,
        instructions: str
    ) -> List[AlertDispatchRecord]:
        results: List[AlertDispatchRecord] = []
        body = (
            f"[NDRF / rakshak ALERT - {alert_level}]\n"
            f"Location: {ward_name} ({ward_id})\n"
            f"Risk Score: {risk_score:.1f}/100\n"
            f"Directive: {instructions}\n"
            f"Emergency Response Contact: 1077 (District EOC) / 112 (NDRF)"
        )

        for recipient in recipients:
            dispatch_id = str(uuid.uuid4())[:8]
            rec = AlertDispatchRecord(
                dispatch_id=dispatch_id,
                recipient=recipient,
                ward_id=ward_id,
                ward_name=ward_name,
                risk_score=risk_score,
                alert_level=alert_level,
                message_body=body,
                provider=self.name,
                status="SENT"
            )
            self.history.append(rec)
            results.append(rec)
            logger.info(
                "SMS Alert Dispatched [%s] to %s: Ward=%s Risk=%.1f Level=%s",
                dispatch_id,
                recipient,
                ward_name,
                risk_score,
                alert_level
            )

        return results
