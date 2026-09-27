"""
BaseAdapter specification for all external data sources.
Ensures clean separation of concerns, explicit health status tracking,
strict error isolation, and structured logging.
"""
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, Optional
import logging
from pydantic import BaseModel, Field

logger = logging.getLogger("rakshak.ingestion")


class AdapterHealthStatus(str, Enum):
    HEALTHY = "HEALTHY"
    DEGRADED = "DEGRADED"
    UNAVAILABLE = "UNAVAILABLE"


class IngestionResult(BaseModel):
    source_name: str
    is_successful: bool
    status: AdapterHealthStatus
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    latency_ms: float = 0.0
    data: Dict[str, Any] = Field(default_factory=dict)
    error_message: Optional[str] = None
    is_live_data: bool = True  # Explicitly flags if live data was received vs cached/fallback


class BaseAdapter(ABC):
    """
    Abstract adapter for external services following the Adapter Pattern.
    Prevents single-source failures from taking down the pipeline.
    """

    def __init__(self, name: str, timeout_seconds: float = 8.0):
        self.name = name
        self.timeout_seconds = timeout_seconds
        self.status = AdapterHealthStatus.HEALTHY
        self.last_checked: Optional[datetime] = None
        self.last_latency_ms: float = 0.0
        self.consecutive_failures: int = 0

    @abstractmethod
    async def fetch(self, lat: float, lon: float, **kwargs) -> IngestionResult:
        """Fetch data from upstream service for given geographic coordinates."""
        pass

    @abstractmethod
    async def health_check(self) -> AdapterHealthStatus:
        """Check availability and latency of the upstream service endpoint."""
        pass

    def record_success(self, latency_ms: float):
        self.status = AdapterHealthStatus.HEALTHY
        self.consecutive_failures = 0
        self.last_latency_ms = latency_ms
        self.last_checked = datetime.now(timezone.utc)

    def record_failure(self, error: Exception):
        self.consecutive_failures += 1
        self.last_checked = datetime.now(timezone.utc)
        if self.consecutive_failures >= 3:
            self.status = AdapterHealthStatus.UNAVAILABLE
        else:
            self.status = AdapterHealthStatus.DEGRADED
        logger.error(
            "Adapter %s failure #%d: %s",
            self.name,
            self.consecutive_failures,
            str(error),
            exc_info=False
        )

    def get_status_summary(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "status": self.status.value,
            "last_checked": self.last_checked.isoformat() if self.last_checked else None,
            "last_latency_ms": round(self.last_latency_ms, 2),
            "consecutive_failures": self.consecutive_failures,
        }
