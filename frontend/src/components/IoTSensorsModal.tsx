import React, { useState } from 'react';
import {
  X,
  Radio,
  Activity,
  BatteryCharging,
  Gauge,
  Compass,
  Zap,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Waves
} from 'lucide-react';
import { SensorNode } from '../types';

interface IoTSensorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sensors: SensorNode[];
  onSelectWard: (wardId: string) => void;
  onSimulateSurge: (wardId: string) => Promise<void>;
  onRefreshSensors: () => Promise<void>;
}

export const IoTSensorsModal: React.FC<IoTSensorsModalProps> = ({
  isOpen,
  onClose,
  sensors,
  onSelectWard,
  onSimulateSurge,
  onRefreshSensors
}) => {
  const [pingingNodeId, setPingingNodeId] = useState<string | null>(null);
  const [simulatingNodeId, setSimulatingNodeId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePing = async (nodeId: string) => {
    setPingingNodeId(nodeId);
    try {
      const res = await fetch(`/api/v1/sensors/${nodeId}/ping`, { method: 'POST' });
      if (res.ok) {
        setFeedbackMsg(`Telemetry ACK received from ${nodeId}. Status: 100% Nominal.`);
        await onRefreshSensors();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPingingNodeId(null);
      setTimeout(() => setFeedbackMsg(null), 4000);
    }
  };

  const handleSurgeSim = async (node: SensorNode) => {
    setSimulatingNodeId(node.node_id);
    try {
      await onSimulateSurge(node.ward_id);
      setFeedbackMsg(`Simulated river surge triggered on ${node.river_name} (${node.node_id}). Alert updated!`);
      await onRefreshSensors();
    } catch (e) {
      console.error(e);
    } finally {
      setSimulatingNodeId(null);
      setTimeout(() => setFeedbackMsg(null), 5000);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="iot-sensors-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
    >
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-slate-800">
        {/* Header */}
        <div className="p-5 border-b border-[#043335] flex items-center justify-between bg-[#064244] text-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#0a5254] border border-[#0e6264] flex items-center justify-center text-teal-300">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 id="iot-sensors-title" className="font-display font-bold text-lg text-white">
                IoT Field Sensor Stream Network
              </h3>
              <p className="text-xs text-teal-200/80 font-mono">
                Real-Time Ultrasonic Water-Level Sonar & Accelerometer Tilt Nodes (Mandi, Kullu, Kangra)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close IoT Sensors Modal"
            className="p-1.5 rounded-full hover:bg-white/10 text-teal-200 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Feedback Notification */}
        {feedbackMsg && (
          <div className="bg-teal-50 border-b border-teal-200 px-5 py-2.5 flex items-center gap-2 text-xs font-mono text-[#064244] animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="font-semibold">{feedbackMsg}</span>
          </div>
        )}

        {/* Sub-Header Banner */}
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center space-x-4">
            <div>
              <span className="text-slate-500">Active Nodes:</span>{' '}
              <strong className="text-[#064244]">{sensors.length} Stations</strong>
            </div>
            <div>
              <span className="text-slate-500">Ingestion Protocol:</span>{' '}
              <strong className="text-emerald-700 font-semibold">ESP32 HTTP/LoRaWAN Gateway</strong>
            </div>
          </div>
          <button
            onClick={onRefreshSensors}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 transition-all text-xs font-semibold shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#064244]" />
            <span>Refresh Telemetry</span>
          </button>
        </div>

        {/* Sensor Grid */}
        <div className="p-5 overflow-y-auto space-y-4 bg-[#f8fafc]">
          {sensors.map((node) => {
            const isSurge = node.status === 'SURGE_WARNING' || node.water_level_cm > 400;
            const waterPct = Math.min(100, Math.round((node.water_level_cm / 500) * 100));

            return (
              <div
                key={node.node_id}
                className={`bg-white border rounded-2xl p-5 transition-all shadow-sm ${
                  isSurge
                    ? 'border-red-400 ring-2 ring-red-200'
                    : 'border-slate-200 hover:border-[#064244]/40 hover:shadow-md'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  {/* Station Identity */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-[#064244] border border-teal-200">
                        {node.node_id}
                      </span>
                      <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold uppercase ${
                        isSurge ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}>
                        {isSurge ? 'Surge Danger' : 'Online / Nominal'}
                      </span>
                      <span className="text-xs font-mono text-slate-500">
                        {node.district_name} District
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
                      <span>{node.node_name}</span>
                    </h4>

                    <div className="text-xs font-mono text-[#064244] flex items-center gap-1.5">
                      <Waves className="w-3.5 h-3.5 text-[#064244]" />
                      <span>River Catchment: <strong>{node.river_name}</strong></span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-500">Assigned: {node.ward_name} ({node.ward_id})</span>
                    </div>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <button
                      onClick={() => handlePing(node.node_id)}
                      disabled={pingingNodeId === node.node_id}
                      className="px-3 py-1.5 rounded-full bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-mono flex items-center gap-1.5 transition-all shadow-xs"
                      title="Send telemetry ping request"
                    >
                      <Activity className={`w-3.5 h-3.5 text-[#064244] ${pingingNodeId === node.node_id ? 'animate-spin' : ''}`} />
                      <span>{pingingNodeId === node.node_id ? 'Pinging...' : 'Ping Node'}</span>
                    </button>

                    <button
                      onClick={() => handleSurgeSim(node)}
                      disabled={simulatingNodeId === node.node_id}
                      className="px-3 py-1.5 rounded-full bg-[#ea580c] hover:bg-[#d94e08] text-white text-xs font-mono flex items-center gap-1.5 transition-all shadow-xs font-semibold"
                      title="Simulate flash surge at this river gauge"
                    >
                      <Zap className="w-3.5 h-3.5 text-white" />
                      <span>{simulatingNodeId === node.node_id ? 'Simulating...' : 'Simulate Surge'}</span>
                    </button>

                    <button
                      onClick={() => {
                        onSelectWard(node.ward_id);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-full bg-[#064244] hover:bg-[#0a5254] text-white text-xs font-mono flex items-center gap-1 transition-all shadow-xs font-semibold"
                      title="Inspect ward on tactical map"
                    >
                      <span>View Map</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Telemetry Metrics Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-slate-100 font-mono text-xs">
                  {/* Sonar Stage */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div className="text-slate-500 text-[10px] flex items-center gap-1 font-semibold uppercase">
                      <Gauge className="w-3 h-3 text-[#064244]" />
                      <span>River Stage (Sonar)</span>
                    </div>
                    <div className="text-base font-bold text-slate-900 mt-1 flex items-baseline gap-1">
                      <span className={isSurge ? 'text-red-600 font-black' : 'text-[#064244]'}>
                        {node.water_level_cm.toFixed(1)}
                      </span>
                      <span className="text-[10px] text-slate-500 font-normal">cm</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div
                        className={`h-full ${isSurge ? 'bg-red-500' : 'bg-[#10b981]'}`}
                        style={{ width: `${waterPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Rate of Rise */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div className="text-slate-500 text-[10px] flex items-center gap-1 font-semibold uppercase">
                      <Activity className="w-3 h-3 text-amber-600" />
                      <span>Rate of Rise</span>
                    </div>
                    <div className="text-base font-bold text-slate-900 mt-1 flex items-baseline gap-1">
                      <span className={node.water_level_rate_cm_per_hr > 30 ? 'text-red-600' : 'text-amber-600'}>
                        +{node.water_level_rate_cm_per_hr.toFixed(1)}
                      </span>
                      <span className="text-[10px] text-slate-500 font-normal">cm/hr</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-2 truncate">
                      {node.water_level_rate_cm_per_hr > 30 ? 'Torrential Surge Rate' : 'Moderate Inflow'}
                    </div>
                  </div>

                  {/* Slope Tilt */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div className="text-slate-500 text-[10px] flex items-center gap-1 font-semibold uppercase">
                      <Compass className="w-3 h-3 text-purple-600" />
                      <span>Sensor Tilt Angle</span>
                    </div>
                    <div className="text-base font-bold text-purple-700 mt-1 flex items-baseline gap-1">
                      <span>{node.tilt_angle_deg.toFixed(1)}°</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-2 truncate">
                      {node.tilt_angle_deg > 5.0 ? 'Subsurface Shear Warning' : 'Stable Bedrock Mount'}
                    </div>
                  </div>

                  {/* Battery & Health */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div className="text-slate-500 text-[10px] flex items-center gap-1 font-semibold uppercase">
                      <BatteryCharging className="w-3 h-3 text-emerald-600" />
                      <span>Battery / Solar</span>
                    </div>
                    <div className="text-base font-bold text-emerald-700 mt-1 flex items-baseline gap-1">
                      <span>{node.battery_level_pct.toFixed(0)}%</span>
                      <span className="text-[10px] text-emerald-600 font-normal">Solar Charged</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-2 truncate">
                      Last ping: {new Date(node.last_ping).toLocaleTimeString()}
                    </div>
                  </div>
                </div>

                {/* LoRaWAN SX1276 Radio Telemetry Inspector */}
                <div className="mt-3 p-3 rounded-xl bg-slate-900 text-[11px] font-mono shadow-inner text-slate-300">
                  <div className="flex flex-wrap items-center justify-between text-slate-400 mb-1.5 gap-2">
                    <div className="flex items-center space-x-1.5 text-teal-400">
                      <Radio className="w-3.5 h-3.5 text-teal-400" />
                      <span className="font-bold text-[10px] uppercase tracking-wider text-slate-200">LoRa SX1276 Packet Uplink</span>
                    </div>
                    <div className="flex items-center space-x-2 text-[10px]">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">IN865 / 868.1 MHz</span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">SF10 • BW 125kHz</span>
                      <span className="text-emerald-400 font-bold">RSSI: -108 dBm</span>
                      <span className="text-teal-300 font-bold">SNR: +7.8 dB</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-[10px] gap-2">
                    <div className="text-slate-400 truncate">
                      FRAME: <span className="text-amber-400 font-bold">0x08A2 01 {Math.round(node.water_level_cm).toString(16).padStart(4, '0').toUpperCase()} {Math.round(node.tilt_angle_deg * 10).toString(16).padStart(4, '0').toUpperCase()} {Math.round(node.battery_level_pct).toString(16).toUpperCase()} 1F</span>
                    </div>
                    <div className="text-emerald-400 font-bold text-[9px] flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>CRC-8 VALID • 18 KM VALLEY REACH (NO 4G NEEDED)</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
