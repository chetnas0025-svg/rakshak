"""
Twilio SMS Notification Provider implementation.
Sends real SMS alerts via Twilio API when credentials are provided in settings.
"""
import uuid
from datetime import datetime, timezone
from typing import List
import httpx
from rakshak.config import settings
from rakshak.messaging.provider import BaseNotificationProvider, AlertDispatchRecord, logger


class TwilioNotificationProvider(BaseNotificationProvider):
    def __init__(self):
        super().__init__(name="Twilio_SMS_Provider")
        self.account_sid = settings.TWILIO_ACCOUNT_SID
        self.auth_token = settings.TWILIO_AUTH_TOKEN
        self.from_number = settings.TWILIO_FROM_NUMBER

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
            f"[NDRF / rakshak ALERT] {alert_level}\n"
            f"Ward: {ward_name} ({ward_id})\n"
            f"Risk Index: {risk_score:.1f}/100\n"
            f"Action: {instructions}\n"
            f"Helpline: 1077 (Disaster Management)"
        )

        if not (self.account_sid and self.auth_token and self.from_number):
            logger.warning("Twilio credentials not configured. Failing back to simulate dispatch.")
            for recipient in recipients:
                rec = AlertDispatchRecord(
                    dispatch_id=str(uuid.uuid4())[:8],
                    recipient=recipient,
                    ward_id=ward_id,
                    ward_name=ward_name,
                    risk_score=risk_score,
                    alert_level=alert_level,
                    message_body=body,
                    provider=self.name,
                    status="FAILED",
                    error_detail="Twilio credentials missing in configuration"
                )
                self.history.append(rec)
                results.append(rec)
            return results

        url = f"https://api.twilio.com/2010-04-01/Accounts/{self.account_sid}/Messages.json"
        auth = (self.account_sid, self.auth_token)

        async with httpx.AsyncClient() as client:
            for recipient in recipients:
                dispatch_id = str(uuid.uuid4())[:8]
                try:
                    resp = await client.post(
                        url,
                        auth=auth,
                        data={
                            "From": self.from_number,
                            "To": recipient,
                            "Body": body
                        },
                        timeout=10.0
                    )
                    if resp.status_code in [200, 201]:
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
                    else:
                        rec = AlertDispatchRecord(
                            dispatch_id=dispatch_id,
                            recipient=recipient,
                            ward_id=ward_id,
                            ward_name=ward_name,
                            risk_score=risk_score,
                            alert_level=alert_level,
                            message_body=body,
                            provider=self.name,
                            status="FAILED",
                            error_detail=f"Twilio error {resp.status_code}: {resp.text}"
                        )
                except Exception as e:
                    rec = AlertDispatchRecord(
                        dispatch_id=dispatch_id,
                        recipient=recipient,
                        ward_id=ward_id,
                        ward_name=ward_name,
                        risk_score=risk_score,
                        alert_level=alert_level,
                        message_body=body,
                        provider=self.name,
                        status="FAILED",
                        error_detail=str(e)
                    )
                self.history.append(rec)
                results.append(rec)

        return results
