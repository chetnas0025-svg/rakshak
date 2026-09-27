"""
Notification provider interface for Rakshak.
Implements the Provider pattern so SMS providers (Twilio, MSG91, Bhashini) can be swapped seamlessly.
"""
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
import logging
from pydantic import BaseModel, Field

logger = logging.getLogger("rakshak.alerts")


class AlertDispatchRecord(BaseModel):
    dispatch_id: str
    recipient: str
    ward_id: str
    ward_name: str
    risk_score: float
    alert_level: str
    message_body: str
    provider: str
    status: str  # "SENT", "FAILED", "QUEUED"
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    error_detail: Optional[str] = None


class BaseNotificationProvider(ABC):
    def __init__(self, name: str):
        self.name = name
        self.history: List[AlertDispatchRecord] = []

    @abstractmethod
    async def send_alert(
        self,
        recipients: List[str],
        ward_id: str,
        ward_name: str,
        risk_score: float,
        alert_level: str,
        instructions: str
    ) -> List[AlertDispatchRecord]:
        """Dispatches emergency alerts to a list of phone numbers or endpoints."""
        pass

    def get_dispatch_history(self) -> List[AlertDispatchRecord]:
        return self.history
