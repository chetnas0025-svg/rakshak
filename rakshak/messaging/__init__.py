"""
Notification and Alert Dispatching module for Rakshak.
Supports Twilio SMS and local Console/Mock providers via a common interface.
"""
from rakshak.messaging.provider import BaseNotificationProvider, AlertDispatchRecord

__all__ = ["BaseNotificationProvider", "AlertDispatchRecord"]
