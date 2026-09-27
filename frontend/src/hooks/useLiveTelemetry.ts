import { useState, useEffect } from 'react';
import { SensorNode } from '../types';

interface LiveTelemetryState {
  isConnected: boolean;
  lastUpdated: string;
  streamingSensors: SensorNode[];
  activeWarningsCount: number;
}

/**
 * Custom React hook subscribing to Server-Sent Events (SSE) from /api/v1/stream/telemetry.
 * Provides fallback polling if SSE disconnects.
 */
export function useLiveTelemetry(initialSensors: SensorNode[]): LiveTelemetryState {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toLocaleTimeString());
  const [streamingSensors, setStreamingSensors] = useState<SensorNode[]>(initialSensors);
  const [activeWarningsCount, setActiveWarningsCount] = useState<number>(0);

  useEffect(() => {
    if (initialSensors.length > 0 && streamingSensors.length === 0) {
      setStreamingSensors(initialSensors);
    }
  }, [initialSensors]);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let fallbackInterval: any = null;

    try {
      eventSource = new EventSource('/api/v1/stream/telemetry');

      eventSource.onopen = () => {
        setIsConnected(true);
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.sensors && Array.isArray(data.sensors)) {
            setStreamingSensors(data.sensors);
          }
          if (typeof data.active_warnings === 'number') {
            setActiveWarningsCount(data.active_warnings);
          }
          setLastUpdated(new Date().toLocaleTimeString());
          setIsConnected(true);
        } catch (e) {
          console.warn('Error parsing SSE telemetry frame:', e);
        }
      };

      eventSource.onerror = () => {
        setIsConnected(false);
        if (eventSource) {
          eventSource.close();
        }
      };
    } catch (err) {
      setIsConnected(false);
    }

    // Periodic heartbeat fallback every 15s to keep numbers dynamic
    fallbackInterval = setInterval(async () => {
      try {
        const res = await fetch('/api/v1/sensors');
        if (res.ok) {
          const fresh = await res.json();
          setStreamingSensors(fresh);
          setLastUpdated(new Date().toLocaleTimeString());
          setIsConnected(true);
        }
      } catch (e) {
        setIsConnected(false);
      }
    }, 15000);

    return () => {
      if (eventSource) eventSource.close();
      if (fallbackInterval) clearInterval(fallbackInterval);
    };
  }, []);

  return {
    isConnected,
    lastUpdated,
    streamingSensors,
    activeWarningsCount
  };
}
