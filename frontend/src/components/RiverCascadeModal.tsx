import React, { useEffect, useState } from 'react';
import {
  X,
  Waves,
  ArrowDownRight,
  Clock,
  Compass,
  Zap,
  Activity,
  ChevronRight
} from 'lucide-react';

interface RiverNode {
  node_id: string;
  ward_id: string;
  name: string;
  river: string;
  elevation_m: number;
  distance_from_source_km: number;
  channel_slope: number;
  travel_time_hours_from_source: number;
  downstream_node_id?: string;
}

interface RiverBasin {
  river: string;
  node_count: number;
  headwater_elevation_m: number;
  terminal_elevation_m: number;
  total_drop_m: number;
  nodes: RiverNode[];
}

interface CascadeDownstreamItem {
  node_id: string;
  ward_id: string;
  ward_name: string;
  distance_from_origin_km: number;
  estimated_surge_arrival_hours: number;
  projected_peak_stage_m: number;
  threat_severity: string;
}

interface CascadeResult {
  origin_ward_id: string;
  origin_ward_name: string;
  river: string;
  surge_stage_m: number;
  downstream_cascade: CascadeDownstreamItem[];
  downstream_wards_at_risk_count: number;
}

interface RiverCascadeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectWard?: (wardId: string) => void;
}

export const RiverCascadeModal: React.FC<RiverCascadeModalProps> = ({
  isOpen,
  onClose,
  onSelectWard
}) => {
  const [basins, setBasins] = useState<RiverBasin[]>([]);
  const [selectedRiver, setSelectedRiver] = useState<string>('Beas');
  const [selectedOriginWard, setSelectedOriginWard] = useState<string>('HP-KLU-04');
  const [cascadeData, setCascadeData] = useState<CascadeResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;
    const fetchNetworks = async () => {
      try {
        const res = await fetch('/api/v1/catchment/networks');
        if (res.ok) {
          const data = await res.json();
          setBasins(data);
        }
      } catch (err) {
        console.error('Failed to fetch catchment networks:', err);
      }
    };
    fetchNetworks();
  }, [isOpen]);

  const activeBasin = basins.find(b => b.river === selectedRiver) || basins[0];

  useEffect(() => {
    if (!isOpen || !activeBasin) return;
    const fetchCascade = async () => {
      setLoading(true);
      try {
        const wardId = selectedOriginWard || activeBasin.nodes[0].ward_id;
        const res = await fetch(`/api/v1/catchment/cascade/${wardId}?surge_stage_m=4.2`);
        if (res.ok) {
          const data = await res.json();
          setCascadeData(data);
        }
      } catch (err) {
        console.error('Failed to fetch cascade impact:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCascade();
  }, [isOpen, selectedRiver, selectedOriginWard, activeBasin]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
    >
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-800">
        {/* Header */}
        <div className="p-5 border-b border-[#043335] flex items-center justify-between bg-[#064244] text-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#0a5254] border border-[#0e6264] flex items-center justify-center text-teal-300">
              <Waves className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <span>Hydrological Catchment Routing & River Cascade</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-200 border border-teal-400/30 font-semibold">
                  MANNING'S EQUATION
                </span>
              </h3>
              <p className="text-xs text-teal-200/80">
                Upstream-to-downstream floodwave propagation delays across Himachal steep-gradient valleys
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-teal-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* River Basin Tabs */}
        <div className="px-6 pt-3 border-b border-slate-200 bg-slate-50 flex space-x-2">
          {basins.map(b => (
            <button
              key={b.river}
              onClick={() => {
                setSelectedRiver(b.river);
                if (b.nodes.length > 0) setSelectedOriginWard(b.nodes[0].ward_id);
              }}
              className={`px-4 py-2 text-xs font-semibold rounded-t-xl transition-all flex items-center space-x-2 border-b-2 ${
                selectedRiver === b.river
                  ? 'border-[#064244] text-[#064244] bg-white font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
            >
              <span>{b.river} Catchment</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                {b.node_count} Nodes
              </span>
            </button>
          ))}
        </div>

        {/* Basin Profile Banner */}
        {activeBasin && (
          <div className="px-6 py-3 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between text-xs gap-3 text-slate-600 font-mono">
            <div className="flex items-center space-x-4">
              <span className="text-slate-500">
                Headwater: <strong className="text-slate-800">{activeBasin.headwater_elevation_m}m</strong>
              </span>
              <ArrowDownRight className="w-3.5 h-3.5 text-[#064244]" />
              <span className="text-slate-500">
                Terminal: <strong className="text-slate-800">{activeBasin.terminal_elevation_m}m</strong>
              </span>
              <span className="text-[#064244] font-semibold">
                Total Vertical Drop: <strong>{activeBasin.total_drop_m}m</strong>
              </span>
            </div>
            <div className="text-[11px] text-slate-500">
              Kinematic Wave celerity: ~4.2 - 6.8 m/s in narrow mountain gorge
            </div>
          </div>
        )}

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-[#f8fafc]">
          {/* River Topological Nodes */}
          <div>
            <h4 className="text-xs font-semibold text-slate-700 mb-3 flex items-center justify-between">
              <span className="uppercase tracking-wider">RIVER PROFILE: SELECT UPSTREAM SURGE ORIGIN</span>
              <span className="text-[11px] font-mono text-[#064244] font-medium">
                Click any upstream ward to recalculate downstream surge arrival ETAs
              </span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {activeBasin?.nodes.map((node, idx) => {
                const isOrigin = selectedOriginWard === node.ward_id;
                return (
                  <button
                    key={node.node_id}
                    onClick={() => setSelectedOriginWard(node.ward_id)}
                    className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden bg-white shadow-xs ${
                      isOrigin
                        ? 'border-[#064244] ring-2 ring-[#064244]/20 shadow-md'
                        : 'border-slate-200 hover:border-slate-300 hover:shadow'
                    }`}
                  >
                    {isOrigin && (
                      <div className="absolute top-0 right-0 bg-[#ea580c] text-white text-[9px] font-bold px-2 py-0.5 rounded-bl-lg">
                        ORIGIN
                      </div>
                    )}
                    <div className="flex items-center space-x-1.5 text-[10px] font-mono text-slate-400 mb-1">
                      <span>STEP {idx + 1}</span>
                      <span>•</span>
                      <span>{node.node_id}</span>
                    </div>
                    <div className="text-xs font-bold text-slate-900 mb-2 truncate">
                      {node.name}
                    </div>
                    <div className="space-y-1 text-[11px] text-slate-500 font-mono">
                      <div className="flex justify-between">
                        <span>Elevation:</span>
                        <strong className="text-slate-800">{node.elevation_m}m</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Distance:</span>
                        <span className="text-slate-700">{node.distance_from_source_km} km</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Slope:</span>
                        <span className="text-[#064244] font-bold">{(node.channel_slope * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Downstream Cascade Impact Results */}
          <div className="p-5 rounded-2xl border border-teal-200 bg-white shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-[#ea580c]" />
                <h4 className="text-xs font-bold text-[#064244] uppercase tracking-wider">
                  Downstream Surge Propagation Timeline (Origin: {cascadeData?.origin_ward_name})
                </h4>
              </div>
              <span className="text-xs font-mono text-teal-800 font-bold bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
                {cascadeData?.downstream_wards_at_risk_count} Downstream Wards Threatened
              </span>
            </div>

            {loading ? (
              <div className="py-6 text-center text-xs text-slate-400">Calculating hydraulic flow routing...</div>
            ) : cascadeData && cascadeData.downstream_cascade.length > 0 ? (
              <div className="space-y-2.5">
                {cascadeData.downstream_cascade.map((item, index) => (
                  <div
                    key={item.node_id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs hover:bg-slate-50"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 rounded-full bg-[#064244] text-white font-bold flex items-center justify-center text-[11px]">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{item.ward_name}</div>
                        <div className="text-[11px] text-slate-500">
                          {item.distance_from_origin_km} km downstream along {selectedRiver} River
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6">
                      <div className="text-right">
                        <div className="text-[10px] text-slate-500 uppercase font-semibold">Estimated Surge Arrival (ETA)</div>
                        <div className="font-mono font-bold text-sm text-amber-700 flex items-center justify-end space-x-1">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>+{item.estimated_surge_arrival_hours} hrs</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-[10px] text-slate-500 uppercase font-semibold">Projected Peak Stage</div>
                        <div className="font-mono font-bold text-sm text-[#064244]">
                          {item.projected_peak_stage_m} m
                        </div>
                      </div>

                      <div>
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold shadow-xs ${
                            item.threat_severity === 'HIGH'
                              ? 'bg-red-100 text-red-700 border border-red-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {item.threat_severity} RISK
                        </span>
                      </div>

                      {onSelectWard && (
                        <button
                          onClick={() => {
                            onSelectWard(item.ward_id);
                            onClose();
                          }}
                          className="px-3 py-1 text-[11px] rounded-full bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 flex items-center space-x-1 transition-colors shadow-xs font-semibold"
                        >
                          <span>Inspect</span>
                          <ChevronRight className="w-3 h-3 text-slate-500" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-4 text-center text-xs text-slate-400">
                Selected node is at the terminal end of the catchment; no further downstream wards in this sub-basin.
              </div>
            )}
          </div>

          {/* Hydrological Manning's Callout */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white text-xs text-slate-600 space-y-1.5 shadow-xs">
            <div className="font-semibold text-slate-800 flex items-center space-x-1.5">
              <Compass className="w-4 h-4 text-[#064244]" />
              <span>Scientific Routing Model: Manning's Kinematic Wave</span>
            </div>
            <p className="leading-relaxed">
              Velocity of floodwave propagation is calculated as{' '}
              <code className="px-1.5 py-0.5 rounded bg-slate-100 text-[#064244] font-mono">
                v = (1/n) * R^(2/3) * S^(1/2)
              </code>
              , where roughness coefficient{' '}
              <code className="px-1 py-0.2 rounded bg-slate-100 text-slate-700 font-mono">n = 0.045</code> (boulder-strewn
              Himalayan riverbeds) and hydraulic radius{' '}
              <code className="px-1 py-0.2 rounded bg-slate-100 text-slate-700 font-mono">R ≈ 3.5m</code>. This models
              the real surge transmission window giving downstream tehsils 1.5 to 5.6 hours of life-saving lead time.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
          <div className="text-slate-500 flex items-center space-x-2">
            <Activity className="w-4 h-4 text-[#064244]" />
            <span>Covers 11 connected gauging points along Beas, Parbati, and Tirthan rivers</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-[#064244] hover:bg-[#0a5254] text-white font-semibold transition-colors shadow-xs"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
