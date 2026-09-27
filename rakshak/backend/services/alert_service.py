"""
Alert Service for Rakshak.
Evaluates warning thresholds, formats multi-lingual emergency instructions,
and coordinates dispatch via Twilio SMS or Mock Console provider.
"""
from typing import List, Optional, Dict, Any
from rakshak.config import settings
from rakshak.messaging.provider import BaseNotificationProvider, AlertDispatchRecord
from rakshak.messaging.twilio_provider import TwilioNotificationProvider
from rakshak.messaging.console_provider import ConsoleNotificationProvider
from rakshak.backend.services.risk_service import risk_service


class AlertService:
    def __init__(self):
        if settings.NOTIFICATION_PROVIDER.lower() == "twilio":
            self.provider: BaseNotificationProvider = TwilioNotificationProvider()
        else:
            self.provider = ConsoleNotificationProvider()

    async def trigger_ward_alert(
        self,
        ward_id: str,
        phone_numbers: Optional[List[str]] = None,
        custom_instruction: Optional[str] = None
    ) -> List[AlertDispatchRecord]:
        ward_risk = risk_service.get_ward_risk(ward_id)
        if not ward_risk:
            raise ValueError(f"Ward {ward_id} not found in registry")

        recipients = phone_numbers or settings.DEFAULT_ALERT_PHONE_NUMBERS

        # Determine automated action instructions based on severity level
        if custom_instruction:
            instruction = custom_instruction
        elif ward_risk.risk_score >= 80.0:
            instruction = (
                "CRITICAL FLASH FLOOD DIRECTIVE: Imminent cloudburst surge detected. "
                "Discontinue stream bed activities and initiate village emergency protocols immediately."
            )
        elif ward_risk.risk_score >= 60.0:
            instruction = (
                "WATCH DIRECTIVE: High probability of flash surge within 3-6 hours. "
                "Prepare emergency go-bags, secure livestock, restrict travel on vulnerable road links."
            )
        else:
            instruction = (
                "ADVISORY DIRECTIVE: Monsoon saturation high. Monitor local khad water levels."
            )

        dispatches = await self.provider.send_alert(
            recipients=recipients,
            ward_id=ward_risk.ward_id,
            ward_name=ward_risk.ward_name,
            risk_score=ward_risk.risk_score,
            alert_level=ward_risk.alert_level,
            instructions=instruction
        )
        return dispatches

    def get_recent_dispatches(self) -> List[AlertDispatchRecord]:
        return self.provider.get_dispatch_history()


alert_service = AlertService()
