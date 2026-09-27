"""
Ingestion layer for Rakshak.
Contains modular adapters with standard interfaces for weather, terrain, satellite, and sensor data.
"""
from rakshak.ingestion.base import BaseAdapter, AdapterHealthStatus, IngestionResult

__all__ = ["BaseAdapter", "AdapterHealthStatus", "IngestionResult"]
