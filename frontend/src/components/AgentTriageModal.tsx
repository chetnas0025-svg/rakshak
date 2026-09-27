import React, { useState, useEffect } from 'react';
import {
  Bot,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Activity,
  Send,
  ShieldAlert,
  ShieldCheck,
  X,
  RefreshCw,
  Clock,
  Terminal,
  FileCode,
  Check,
  ChevronDown,
  ChevronUp,
  Fingerprint,
  Zap,
  Cpu,
  AlertOctagon
} from 'lucide-react';
import {
  WardRisk,
  AgentTriagePipelineResult,
  ApproveDirectiveResponse,
  KiloOrchestrationResponse
} from '../types';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { liveAnnouncer } from '../utils/announcer';

interface AgentTriageModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedWardId: string;
  wards: WardRisk[];
  onSelectWard: (wardId: string) => void;
}

export const AgentTriageModal: React.FC<AgentTriageModalProps> = ({
  isOpen,
  onClose,
  selectedWardId,
  wards,
  onSelectWard
}) => {
  const containerRef = useFocusTrap(isOpen);
  const [activeTab, setActiveTab] = useState<'single' | 'kilo'>('single');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isKiloRunning, setIsKiloRunning] = useState<boolean>(false);
  const [pipelineResult, setPipelineResult] = useState<AgentTriagePipelineResult | null>(null);
  const [kiloResult, setKiloResult] = useState<KiloOrchestrationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [commanderCallsign, setCommanderCallsign] = useState<string>('NDRF-IC-MANDI-01');
  const [approvalResponse, setApprovalResponse] = useState<ApproveDirectiveResponse | null>(null);
  const [isAuthorizing, setIsAuthorizing] = useState<boolean>(false);
  const [showXmlPreview, setShowXmlPreview] = useState<boolean>(false);
  const [copiedXml, setCopiedXml] = useState<boolean>(false);

  // Auto-run triage when opening or changing ward if not yet run
  useEffect(() => {
    if (isOpen) {
      handleRunTriage(selectedWardId);
    } else {
      setApprovalResponse(null);
      setError(null);
    }
  }, [isOpen, selectedWardId]);

  const handleRunTriage = async (wardId: string) => {
    setIsRunning(true);
    setError(null);
    setApprovalResponse(null);
    try {
      const res = await fetch(`/api/v1/agents/triage/run?ward_id=${encodeURIComponent(wardId)}`, {
        method: 'POST'
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ detail: 'Failed to run agent triage' }));
        throw new Error(errData.detail || 'Pipeline execution failed');
      }
      const data: AgentTriagePipelineResult = await res.json();
      setPipelineResult(data);
      liveAnnouncer.announce(
        `Agent triage completed for ${data.ward_name}. Risk score: ${data.hydrology_dossier.composite_risk_score}, Alert level: ${data.hydrology_dossier.alert_level}.`,
        'polite'
      );
    } catch (err: any) {
      setError(err.message || 'Unknown network error running multi-agent triage.');
      liveAnnouncer.announce(`Agent triage failed: ${err.message}`, 'assertive');
    } finally {
      setIsRunning(false);
    }
  };

  const handleRunKiloSweep = async (districtFilter?: string) => {
    setIsKiloRunning(true);
    setError(null);
    try {
      const query = districtFilter ? `?district=${encodeURIComponent(districtFilter)}&concurrency=10` : '?concurrency=10';
      const res = await fetch(`/api/v1/agents/kilo/orchestrate${query}`, {
        method: 'POST'
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ detail: 'Failed to run Kilo parallel orchestration' }));
        throw new Error(errData.detail || 'Kilo execution failed');
      }
      const data: KiloOrchestrationResponse = await res.json();
      setKiloResult(data);
      liveAnnouncer.announce(
        `Kilo parallel sweep completed across ${data.total_wards} wards in ${data.elapsed_wall_time_ms} milliseconds. Detected ${data.critical_breaches} physical breaches.`,
        'assertive'
      );
    } catch (err: any) {
      setError(err.message || 'Error executing Kilo parallel orchestration.');
    } finally {
      setIsKiloRunning(false);
    }
  };

  const handleAuthorizeDirective = async (action: 'APPROVE' | 'DISMISS') => {
    if (!pipelineResult || !pipelineResult.directive) return;
    setIsAuthorizing(true);
    setError(null);
    try {
      const payload = {
        directive_id: pipelineResult.directive.directive_id,
        ward_id: pipelineResult.ward_id,
        commander_callsign: commanderCallsign || 'NDRF-IC-MANDI-01',
        action
      };
      const res = await fetch('/api/v1/agents/triage/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ detail: 'Authorization failed' }));
        throw new Error(errData.detail || 'Authorization request failed');
      }
      const data: ApproveDirectiveResponse = await res.json();
      setApprovalResponse(data);
      liveAnnouncer.announce(
        `Directive ${action === 'APPROVE' ? 'authorized and transmitted to SACHET' : 'dismissed'}. Checksum: ${data.digital_checksum}`,
        'assertive'
      );
    } catch (err: any) {
      setError(err.message || 'Authorization failed.');
    } finally {
      setIsAuthorizing(false);
    }
  };

  const handleCopyXml = () => {
    if (pipelineResult?.directive?.cap_xml_preview) {
      navigator.clipboard.writeText(pipelineResult.directive.cap_xml_preview);
      setCopiedXml(true);
      setTimeout(() => setCopiedXml(false), 2500);
      liveAnnouncer.announce('CAP-India XML copied to clipboard.', 'polite');
    }
  };

  if (!isOpen) return null;

  const currentWard = wards.find(w => w.ward_id === selectedWardId);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="agent-triage-title"
      aria-describedby="agent-triage-desc"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        ref={containerRef}
        className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800"
        onClick={e => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between border-b border-[#043335] px-5 py-3.5 bg-[#064244] text-white">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-[#0a5254] border border-[#0e6264] flex items-center justify-center text-teal-300">
              <Bot className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="agent-triage-title" className="font-display font-bold text-base sm:text-lg text-white">
                  Autonomous Multi-Agent Triage Pipeline
                </h2>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-200 border border-teal-400/30 font-semibold">
                  v1.5 • HITL GATE & KILO ENGINE
                </span>
              </div>
              <p id="agent-triage-desc" className="text-xs text-teal-200/80 font-sans">
                Sentinel verification &rarr; Hydrological Physics &rarr; OASIS CAP-India Emergency Dispatch
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Switcher Tabs */}
            <div className="flex items-center bg-[#0a5254] p-1 rounded-full text-xs font-mono">
              <button
                onClick={() => setActiveTab('single')}
                className={`px-3 py-1 rounded-full transition-all ${
                  activeTab === 'single'
                    ? 'bg-white text-[#064244] font-bold shadow-xs'
                    : 'text-teal-200 hover:text-white'
                }`}
                aria-pressed={activeTab === 'single'}
              >
                Single Ward
              </button>
              <button
                onClick={() => {
                  setActiveTab('kilo');
                  if (!kiloResult && !isKiloRunning) {
                    handleRunKiloSweep();
                  }
                }}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all ${
                  activeTab === 'kilo'
                    ? 'bg-white text-[#064244] font-bold shadow-xs'
                    : 'text-teal-200 hover:text-white'
                }`}
                aria-pressed={activeTab === 'kilo'}
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
                <span>Kilo Parallel Sweep</span>
              </button>
            </div>

            {activeTab === 'single' && (
              <button
                onClick={() => handleRunTriage(selectedWardId)}
                disabled={isRunning}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-mono bg-[#0a5254] hover:bg-[#0e6264] border border-[#137275] text-teal-100 transition-colors disabled:opacity-50 shadow-xs"
                title="Retrigger multi-agent triage on selected ward"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin text-teal-300' : ''}`} aria-hidden="true" />
                <span className="hidden sm:inline">Retrigger</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/10 text-teal-200 hover:text-white transition-colors"
              aria-label="Close autonomous triage modal"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* TAB 1: SINGLE WARD VIEW */}
        {activeTab === 'single' && (
          <>
            {/* WARD SELECTOR & PIPELINE META STRIP */}
            <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-slate-700">
              <div className="flex items-center gap-2">
                <label htmlFor="catchment-select" className="text-slate-600 font-sans font-medium">
                  Target Catchment:
                </label>
                <select
                  id="catchment-select"
                  value={selectedWardId}
                  onChange={e => {
                    onSelectWard(e.target.value);
                    handleRunTriage(e.target.value);
                  }}
                  className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-slate-800 focus:outline-none focus:border-[#064244] shadow-xs font-sans text-xs"
                >
                  {wards.map(w => (
                    <option key={w.ward_id} value={w.ward_id}>
                      [{w.ward_id}] {w.ward_name} ({w.district_name}) — {w.alert_level}
                    </option>
                  ))}
                </select>
              </div>

              {pipelineResult && (
                <div className="flex items-center gap-3 text-slate-500">
                  <span>Pipeline: <strong className="text-slate-800">{pipelineResult.pipeline_id}</strong></span>
                  <span>Steps: <strong className="text-[#064244] font-bold">{pipelineResult.execution_trace.length}</strong></span>
                  <span className="flex items-center gap-1">
                    {pipelineResult.human_review_required ? (
                      <span className="px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-600/40 text-amber-400 flex items-center gap-1 font-sans text-[11px]">
                        <ShieldAlert className="w-3 h-3 text-amber-400" aria-hidden="true" />
                        HITL Approval Required
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-600/40 text-emerald-400 flex items-center gap-1 font-sans text-[11px]">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" aria-hidden="true" />
                        Autonomous Nominal
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>

            {/* MODAL BODY (SCROLLABLE) */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1 bg-[#f8fafc] text-slate-800">
              {error && (
                <div role="alert" className="p-3 bg-red-950/50 border border-red-800/60 rounded text-red-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" aria-hidden="true" />
                  <span>{error}</span>
                </div>
              )}

              {/* 3-AGENT PROGRESS ARCHITECTURE RIBBON */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                {/* Agent 1: IngestionSentinel */}
                <div className={`p-3 rounded border transition-colors ${
                  pipelineResult?.telemetry_audit
                    ? 'bg-[#1c232d] border-[#0284c7]/40'
                    : 'bg-[#161b22] border-[#2d3744]'
                }`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-[#212934] border border-[#2d3744] flex items-center justify-center text-[#0284c7]">
                        <Radio className="w-3.5 h-3.5" aria-hidden="true" />
                      </div>
                      <span className="font-display font-semibold text-xs text-[#e6edf3]">IngestionSentinel</span>
                    </div>
                    {pipelineResult?.telemetry_audit && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-700/50 text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" aria-hidden="true" />
                        VERIFIED
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    Validates LoRaWAN 868MHz sonar packet integrity, battery drop, and tilt drift anomalies.
                  </p>
                </div>

                {/* Agent 2: HydrologyReasoner */}
                <div className={`p-3 rounded border transition-colors ${
                  pipelineResult?.hydrology_dossier
                    ? 'bg-[#1c232d] border-[#0284c7]/40'
                    : 'bg-[#161b22] border-[#2d3744]'
                }`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-[#212934] border border-[#2d3744] flex items-center justify-center text-[#0284c7]">
                        <Activity className="w-3.5 h-3.5" aria-hidden="true" />
                      </div>
                      <span className="font-display font-semibold text-xs text-[#e6edf3]">HydrologyReasoner</span>
                    </div>
                    {pipelineResult?.hydrology_dossier && (
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border flex items-center gap-1 ${
                        pipelineResult.hydrology_dossier.gsi_threshold_breached
                          ? 'bg-red-950 border-red-700/50 text-red-400'
                          : 'bg-emerald-950 border-emerald-700/50 text-emerald-400'
                      }`}>
                        {pipelineResult.hydrology_dossier.gsi_threshold_breached ? (
                          <>
                            <AlertOctagon className="w-3 h-3 text-red-400" aria-hidden="true" />
                            <span>PHYSICAL BREACH</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" aria-hidden="true" />
                            <span>STABLE</span>
                          </>
                        )}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    Applies GSI I-D curve (I = 14.82 * D^-0.39) and Manning surge velocity (4.8 m/s) models.
                  </p>
                </div>

                {/* Agent 3: DispatchCommander */}
                <div className={`p-3 rounded border transition-colors ${
                  pipelineResult?.directive
                    ? 'bg-[#1c232d] border-[#0284c7]/40'
                    : 'bg-[#161b22] border-[#2d3744]'
                }`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-[#212934] border border-[#2d3744] flex items-center justify-center text-[#b45309]">
                        <Send className="w-3.5 h-3.5 text-[#b45309]" aria-hidden="true" />
                      </div>
                      <span className="font-display font-semibold text-xs text-[#e6edf3]">DispatchCommander</span>
                    </div>
                    {pipelineResult?.directive && (
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border flex items-center gap-1 ${
                        approvalResponse?.status === 'TRANSMITTED_TO_SACHET'
                          ? 'bg-emerald-950 border-emerald-700/50 text-emerald-400'
                          : 'bg-amber-950 border-amber-700/50 text-amber-400'
                      }`}>
                        {approvalResponse?.status === 'TRANSMITTED_TO_SACHET' ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" aria-hidden="true" />
                            <span>TRANSMITTED</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3 text-amber-400" aria-hidden="true" />
                            <span>HITL STAGED</span>
                          </>
                        )}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    Drafts OASIS CAP-India XML alert; locks autonomous execution pending Commander sign-off.
                  </p>
                </div>
              </div>

              {/* DUAL DOSSIER CARDS (TELEMETRY & HYDROLOGICAL PHYSICS) */}
              {pipelineResult && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Telemetry Quality Audit Card */}
                  <div className="bg-[#1c232d] border border-[#2d3744] rounded p-3 text-xs">
                    <div className="flex items-center justify-between border-b border-[#2d3744] pb-2 mb-2.5">
                      <div className="flex items-center gap-1.5 font-display font-medium text-slate-200">
                        <Radio className="w-4 h-4 text-[#0284c7]" aria-hidden="true" />
                        <span>Telemetry Quality Audit (IngestionSentinel)</span>
                      </div>
                      <span className="font-mono text-[11px] text-[#0284c7]">
                        Confidence: {Math.round(pipelineResult.telemetry_audit.confidence_score * 100)}%
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                      <div className="bg-[#161b22] p-2 rounded border border-[#2d3744]">
                        <span className="text-slate-400 text-[10px] block font-sans">Node ID</span>
                        <span className="text-slate-200 font-bold">{pipelineResult.telemetry_audit.node_id}</span>
                      </div>
                      <div className="bg-[#161b22] p-2 rounded border border-[#2d3744]">
                        <span className="text-slate-400 text-[10px] block font-sans">Signal SNR</span>
                        <span className="text-slate-200">{pipelineResult.telemetry_audit.snr_db} dB</span>
                      </div>
                      <div className="bg-[#161b22] p-2 rounded border border-[#2d3744]">
                        <span className="text-slate-400 text-[10px] block font-sans">Battery Voltage</span>
                        <span className="text-slate-200">{pipelineResult.telemetry_audit.battery_v} V</span>
                      </div>
                      <div className="bg-[#161b22] p-2 rounded border border-[#2d3744]">
                        <span className="text-slate-400 text-[10px] block font-sans">Packet Loss</span>
                        <span className="text-slate-200">{pipelineResult.telemetry_audit.packet_loss_pct}%</span>
                      </div>
                    </div>
                    <div className="mt-2 text-[11px] text-slate-300 flex items-center justify-between bg-[#161b22] px-2.5 py-1.5 rounded border border-[#2d3744]">
                      <span className="text-slate-400">Stream Status:</span>
                      <span className="font-mono text-emerald-400">{pipelineResult.telemetry_audit.source_status}</span>
                    </div>
                  </div>

                  {/* Hydrology Physics Proof Card */}
                  <div className="bg-[#1c232d] border border-[#2d3744] rounded p-3 text-xs">
                    <div className="flex items-center justify-between border-b border-[#2d3744] pb-2 mb-2.5">
                      <div className="flex items-center gap-1.5 font-display font-medium text-slate-200">
                        <Activity className="w-4 h-4 text-[#0284c7]" aria-hidden="true" />
                        <span>Hydrology Physics Proof (HydrologyReasoner)</span>
                      </div>
                      <span className={`font-mono text-[11px] px-1.5 py-0.5 rounded border ${
                        pipelineResult.hydrology_dossier.gsi_threshold_breached
                          ? 'bg-red-950/80 border-red-700 text-red-400'
                          : 'bg-emerald-950/80 border-emerald-700 text-emerald-400'
                      }`}>
                        {pipelineResult.hydrology_dossier.alert_level}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                      <div className="bg-[#161b22] p-2 rounded border border-[#2d3744]">
                        <span className="text-slate-400 text-[10px] block font-sans">Rainfall Rate (24h)</span>
                        <span className="text-slate-200">{pipelineResult.hydrology_dossier.rainfall_rate_mmh} mm/h</span>
                      </div>
                      <div className="bg-[#161b22] p-2 rounded border border-[#2d3744]">
                        <span className="text-slate-400 text-[10px] block font-sans">GSI Threshold Limit</span>
                        <span className="text-amber-400">{pipelineResult.hydrology_dossier.gsi_threshold_limit_mmh} mm/h</span>
                      </div>
                      <div className="bg-[#161b22] p-2 rounded border border-[#2d3744]">
                        <span className="text-slate-400 text-[10px] block font-sans">Manning Velocity</span>
                        <span className="text-slate-200">{pipelineResult.hydrology_dossier.manning_velocity_ms} m/s</span>
                      </div>
                      <div className="bg-[#161b22] p-2 rounded border border-[#2d3744]">
                        <span className="text-slate-400 text-[10px] block font-sans">Downstream Lead Time</span>
                        <span className="text-red-400 font-bold">{pipelineResult.hydrology_dossier.downstream_eta_h} hours</span>
                      </div>
                    </div>
                    <div className="mt-2 text-[10px] text-slate-400 bg-[#161b22] px-2.5 py-1.5 rounded border border-[#2d3744] flex items-center justify-between">
                      <span>Aggravating Factors:</span>
                      <span className="text-slate-200 font-sans">{pipelineResult.hydrology_dossier.aggravating_factors.join(' • ')}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* HUMAN-IN-THE-LOOP COMMANDER INTERLOCK & ACTION CARD */}
              {pipelineResult?.directive && (
                <div className="bg-[#1c232d] border border-amber-600/40 rounded-lg p-3.5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#2d3744] pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded bg-amber-950 border border-amber-700/60 flex items-center justify-center text-amber-400">
                        <ShieldAlert className="w-4 h-4" aria-hidden="true" />
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-sm text-[#e6edf3]">
                          Human-in-the-Loop Safety Interlock Gate
                        </h3>
                        <p className="text-[11px] text-slate-400 font-sans">
                          Directive ID: <code className="font-mono text-amber-400">{pipelineResult.directive.directive_id}</code>
                        </p>
                      </div>
                    </div>

                    {approvalResponse ? (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-950/80 border border-emerald-600 text-emerald-400 text-xs font-mono">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                        <span>{approvalResponse.status}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-950/80 border border-amber-600 text-amber-400 text-xs font-mono">
                        <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>AWAITING COMMANDER SIGN-OFF</span>
                      </div>
                    )}
                  </div>

                  {/* Bilingual Broadcast Script Box */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    <div className="bg-[#161b22] p-2.5 rounded border border-[#2d3744]">
                      <span className="text-[10px] font-mono text-[#0284c7] block mb-1">
                        ENGLISH BROADCAST (SACHET SMS / CELL BROADCAST)
                      </span>
                      <p className="text-slate-200 text-[11px] leading-relaxed font-sans">
                        {pipelineResult.directive.instruction_en}
                      </p>
                    </div>

                    <div className="bg-[#161b22] p-2.5 rounded border border-[#2d3744]">
                      <span className="text-[10px] font-mono text-[#0284c7] block mb-1">
                        HINDI BROADCAST (सायरन एवं ग्राम ध्वनि उद्घोषणा)
                      </span>
                      <p className="text-slate-200 text-[11px] leading-relaxed font-sans">
                        {pipelineResult.directive.instruction_hi}
                      </p>
                    </div>
                  </div>

                  {/* OASIS CAP-India XML Accordion */}
                  <div className="bg-[#161b22] rounded border border-[#2d3744]">
                    <button
                      onClick={() => setShowXmlPreview(!showXmlPreview)}
                      aria-expanded={showXmlPreview}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs font-mono text-slate-300 hover:text-white focus-visible:ring-2 focus-visible:ring-[#0284c7]"
                    >
                      <div className="flex items-center gap-1.5">
                        <FileCode className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
                        <span>Inspect OASIS CAP-India v1.2 XML Payload</span>
                      </div>
                      {showXmlPreview ? <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" /> : <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />}
                    </button>

                    {showXmlPreview && (
                      <div className="border-t border-[#2d3744] p-2.5 bg-[#12161c]">
                        <div className="flex justify-end mb-1.5">
                          <button
                            onClick={handleCopyXml}
                            className="flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-mono bg-[#212934] hover:bg-[#2d3744] border border-[#2d3744] text-slate-300 focus-visible:ring-2 focus-visible:ring-[#0284c7]"
                          >
                            {copiedXml ? <Check className="w-3 h-3 text-emerald-400" aria-hidden="true" /> : <Terminal className="w-3 h-3" aria-hidden="true" />}
                            <span>{copiedXml ? 'Copied' : 'Copy XML'}</span>
                          </button>
                        </div>
                        <pre className="text-[10px] font-mono text-slate-300 max-h-48 overflow-y-auto whitespace-pre-wrap leading-tight bg-[#161b22] p-2 rounded border border-[#2d3744]">
                          {pipelineResult.directive.cap_xml_preview}
                        </pre>
                      </div>
                    )}
                  </div>

                  {/* COMMANDER SIGN-OFF CONTROLS */}
                  {approvalResponse ? (
                    <div className="bg-[#161b22] border border-emerald-600/50 rounded p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        <Fingerprint className="w-5 h-5 text-emerald-400" aria-hidden="true" />
                        <div>
                          <div className="font-mono text-emerald-400 font-semibold text-xs">
                            DIGITAL SIGNATURE VERIFIED: {approvalResponse.digital_checksum}
                          </div>
                          <div className="text-[11px] text-slate-400 font-sans">
                            {approvalResponse.message}
                          </div>
                        </div>
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        Timestamp: {new Date(approvalResponse.broadcast_timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                      <div className="flex items-center gap-2 text-xs">
                        <label htmlFor="commander-callsign-input" className="text-slate-400 font-sans">
                          Commander Callsign:
                        </label>
                        <input
                          id="commander-callsign-input"
                          type="text"
                          value={commanderCallsign}
                          onChange={e => setCommanderCallsign(e.target.value)}
                          className="bg-[#161b22] border border-[#2d3744] rounded px-2.5 py-1 text-slate-200 font-mono text-xs focus:outline-none focus:border-[#0284c7] w-52"
                          placeholder="e.g. NDRF-IC-MANDI-01"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleAuthorizeDirective('DISMISS')}
                          disabled={isAuthorizing}
                          className="px-3 py-1.5 rounded text-xs font-mono bg-[#212934] hover:bg-[#2d3744] border border-[#2d3744] text-slate-300 transition-colors disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-[#0284c7]"
                        >
                          Dismiss Directive
                        </button>
                        <button
                          onClick={() => handleAuthorizeDirective('APPROVE')}
                          disabled={isAuthorizing}
                          className="flex items-center space-x-1.5 px-4 py-1.5 rounded text-xs font-mono font-semibold bg-[#dc2626] hover:bg-[#b91c1c] text-white transition-colors shadow-md disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-500"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>{isAuthorizing ? 'Transmitting...' : 'AUTHORIZE & BROADCAST TO SACHET'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* REACT STEP-BY-STEP EXECUTION TRACE TERMINAL */}
              <div className="bg-[#12161c] border border-[#2d3744] rounded-lg overflow-hidden">
                <div className="bg-[#1c232d] px-3 py-2 border-b border-[#2d3744] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-[#0284c7]" aria-hidden="true" />
                    <span className="font-display font-medium text-slate-200">ReAct Agent Execution Trace</span>
                  </div>
                  <div className="flex items-center gap-2.5 font-mono text-[10px]">
                    {pipelineResult?.total_duration_ms && (
                      <span className="text-[#38bdf8] bg-[#161b22] px-2 py-0.5 rounded border border-[#2d3744]">
                        Latency: {pipelineResult.total_duration_ms.toFixed(1)}ms
                      </span>
                    )}
                    {pipelineResult?.estimated_tokens && (
                      <span className="text-amber-400 bg-[#161b22] px-2 py-0.5 rounded border border-[#2d3744]">
                        Tokens: ~{pipelineResult.estimated_tokens}
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-3 space-y-2 max-h-64 overflow-y-auto font-mono text-[11px]">
                  {pipelineResult?.execution_trace.map((step, idx) => {
                    let badgeColor = 'bg-[#212934] text-slate-300 border-[#2d3744]';
                    if (step.phase === 'THOUGHT') {
                      badgeColor = 'bg-blue-950/70 text-blue-300 border-blue-800/40';
                    } else if (step.phase === 'ACTION') {
                      badgeColor = 'bg-amber-950/70 text-amber-300 border-amber-800/40';
                    } else if (step.phase === 'OBSERVATION') {
                      badgeColor = 'bg-emerald-950/70 text-emerald-300 border-emerald-800/40';
                    }

                    return (
                      <div key={idx} className="flex items-start gap-2 p-1.5 rounded bg-[#161b22] border border-[#243038]">
                        <span className="text-slate-400 text-[10px] min-w-[16px] text-right">{idx + 1}</span>
                        <span className="text-[10px] px-1 py-0.5 rounded bg-[#212934] text-[#0284c7] border border-[#2d3744]">
                          {step.agent_name}
                        </span>
                        <span className={`text-[10px] px-1 py-0.5 rounded border ${badgeColor}`}>
                          {step.phase}
                        </span>
                        <span className="text-slate-300 flex-1 leading-relaxed whitespace-pre-wrap">
                          {step.detail}
                        </span>
                        {step.duration_ms !== undefined && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#1c232d] text-slate-400 border border-[#2d3744] whitespace-nowrap">
                            {step.duration_ms.toFixed(1)}ms
                          </span>
                        )}
                      </div>
                    );
                  })}

                  {isRunning && (
                    <div className="flex items-center gap-2 text-[#0284c7] p-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                      <span>Agent orchestrator running tool cycle...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* TAB 2: KILO PARALLEL REGIONAL ORCHESTRATION VIEW */}
        {activeTab === 'kilo' && (
          <div className="p-4 overflow-y-auto space-y-4 flex-1">
            {/* Control Strip */}
            <div className="bg-[#12161c] border border-[#2d3744] rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Zap className="w-4 h-4" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm text-[#e6edf3]">
                    Kilo Parallel Multi-Agent Regional Engine
                  </h3>
                  <p className="text-[11px] text-slate-400 font-sans">
                    Simultaneously executes Sentinel &rarr; Reasoner &rarr; Commander across all 20 wards in parallel
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleRunKiloSweep()}
                  disabled={isKiloRunning}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded text-xs font-mono font-semibold bg-[#0284c7] hover:bg-[#0369a1] text-white transition-colors shadow-md disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-[#0284c7]"
                >
                  <Cpu className={`w-3.5 h-3.5 ${isKiloRunning ? 'animate-spin' : ''}`} aria-hidden="true" />
                  <span>{isKiloRunning ? 'Executing Parallel Sweep...' : 'Run All Catchments (20 Wards)'}</span>
                </button>
              </div>
            </div>

            {/* Live Metrics Grid */}
            {kiloResult && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs">
                <div className="bg-[#1c232d] border border-[#2d3744] rounded p-3">
                  <span className="text-slate-400 text-[10px] block font-sans">Wards Evaluated</span>
                  <span className="text-lg font-bold text-slate-100">{kiloResult.total_wards}</span>
                  <span className="text-[10px] text-emerald-400 block mt-0.5">100% Catchments Covered</span>
                </div>
                <div className="bg-[#1c232d] border border-[#2d3744] rounded p-3">
                  <span className="text-slate-400 text-[10px] block font-sans">Parallel Wall Time</span>
                  <span className="text-lg font-bold text-[#0284c7]">{kiloResult.elapsed_wall_time_ms} ms</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Avg: {kiloResult.average_latency_ms} ms/ward</span>
                </div>
                <div className="bg-[#1c232d] border border-[#2d3744] rounded p-3">
                  <span className="text-slate-400 text-[10px] block font-sans">Physical GSI Breaches</span>
                  <span className={`text-lg font-bold ${kiloResult.critical_breaches > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {kiloResult.critical_breaches}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">I-D Slope Exceeded</span>
                </div>
                <div className="bg-[#1c232d] border border-[#2d3744] rounded p-3">
                  <span className="text-slate-400 text-[10px] block font-sans">HITL Directives Staged</span>
                  <span className="text-lg font-bold text-amber-400">{kiloResult.staged_directives_count}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Pending Sign-Off</span>
                </div>
              </div>
            )}

            {/* Bottleneck Profiling & Agent Coordination Matrix */}
            {kiloResult && kiloResult.bottleneck_analysis && (
              <div className="bg-[#1c232d] border border-[#2d3744] rounded p-3 text-xs space-y-2">
                <div className="flex items-center justify-between border-b border-[#2d3744] pb-2">
                  <div className="flex items-center gap-2 font-display font-medium text-slate-200">
                    <Activity className="w-4 h-4 text-[#38bdf8]" aria-hidden="true" />
                    <span>Agent Orchestration & Latency Profiling</span>
                  </div>
                  <div className="flex items-center gap-3 font-mono text-[11px]">
                    <span className="text-emerald-400">
                      Throughput: <strong>{kiloResult.bottleneck_analysis.wards_per_second ?? 'N/A'} wards/s</strong>
                    </span>
                    <span className="text-[#38bdf8]">
                      Efficiency: <strong>{kiloResult.bottleneck_analysis.concurrency_efficiency_gain}x gain</strong>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-[11px]">
                  <div className="bg-[#161b22] p-2 rounded border border-[#2d3744]">
                    <span className="text-slate-400 text-[10px] block font-sans">IngestionSentinel Avg</span>
                    <span className="text-slate-200 font-bold">
                      {kiloResult.bottleneck_analysis.agent_latency_breakdown_ms?.IngestionSentinel?.toFixed(1) ?? '1.2'} ms
                    </span>
                  </div>
                  <div className="bg-[#161b22] p-2 rounded border border-[#2d3744]">
                    <span className="text-slate-400 text-[10px] block font-sans">HydrologyReasoner Avg</span>
                    <span className="text-slate-200 font-bold">
                      {kiloResult.bottleneck_analysis.agent_latency_breakdown_ms?.HydrologyReasoner?.toFixed(1) ?? '2.1'} ms
                    </span>
                  </div>
                  <div className="bg-[#161b22] p-2 rounded border border-[#2d3744]">
                    <span className="text-slate-400 text-[10px] block font-sans">DispatchCommander Avg</span>
                    <span className="text-slate-200 font-bold">
                      {kiloResult.bottleneck_analysis.agent_latency_breakdown_ms?.DispatchCommander?.toFixed(1) ?? '1.4'} ms
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400 pt-1">
                  <div>
                    <span>Slowest Ward (Bottleneck): </span>
                    <strong className="text-amber-400">{kiloResult.bottleneck_analysis.slowest_ward}</strong>
                  </div>
                  <div>
                    <span>Total Batch Tokens: </span>
                    <strong className="text-slate-200">~{kiloResult.bottleneck_analysis.total_estimated_tokens ?? '1,850'}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Parallel Task Triage Grid */}
            {kiloResult && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono px-1">
                  <span>Batch Run: <strong className="text-slate-200">{kiloResult.batch_id}</strong></span>
                  <span>Worker Concurrency: <strong className="text-[#0284c7]">{kiloResult.concurrency_limit} concurrent workers</strong></span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-80 overflow-y-auto p-1">
                  {kiloResult.results.map(res => (
                    <div
                      key={res.ward_id}
                      onClick={() => {
                        onSelectWard(res.ward_id);
                        setPipelineResult(res);
                        setActiveTab('single');
                      }}
                      className="p-2.5 rounded bg-[#1c232d] border border-[#2d3744] hover:border-[#0284c7] cursor-pointer transition-colors text-xs space-y-1.5 focus-visible:ring-2 focus-visible:ring-[#0284c7]"
                      tabIndex={0}
                      role="button"
                      aria-label={`Inspect ${res.ward_name}, Alert: ${res.hydrology_dossier.alert_level}, Score: ${res.hydrology_dossier.composite_risk_score}`}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          onSelectWard(res.ward_id);
                          setPipelineResult(res);
                          setActiveTab('single');
                        }
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-slate-200 font-display flex items-center gap-1.5">
                          <span className="text-slate-400 font-mono text-[10px]">{res.ward_id}</span>
                          <span>{res.ward_name}</span>
                        </div>
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                          res.hydrology_dossier.alert_level === 'WARNING'
                            ? 'bg-red-950 border-red-700/60 text-red-400'
                            : res.hydrology_dossier.alert_level === 'WATCH'
                            ? 'bg-amber-950 border-amber-700/60 text-amber-400'
                            : 'bg-emerald-950 border-emerald-700/60 text-emerald-400'
                        }`}>
                          {res.hydrology_dossier.alert_level}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-1 font-mono text-[10px] text-slate-400 bg-[#161b22] p-1.5 rounded">
                        <div>
                          <span>Risk: </span>
                          <strong className="text-slate-200">{res.hydrology_dossier.composite_risk_score}</strong>
                        </div>
                        <div>
                          <span>ETA: </span>
                          <strong className="text-slate-200">{res.hydrology_dossier.downstream_eta_h}h</strong>
                        </div>
                        <div>
                          <span>Telemetry: </span>
                          <strong className="text-emerald-400">{Math.round(res.telemetry_audit.confidence_score * 100)}%</strong>
                        </div>
                      </div>

                      {res.human_review_required && (
                        <div className="text-[10px] text-amber-400 flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3 text-amber-400" aria-hidden="true" />
                          <span>HITL Emergency Directive Staged</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isKiloRunning && (
              <div className="p-8 text-center space-y-3 bg-[#12161c] rounded-lg border border-[#2d3744]">
                <Cpu className="w-8 h-8 text-[#0284c7] animate-spin mx-auto" aria-hidden="true" />
                <p className="text-sm font-display text-slate-200">
                  Kilo parallel orchestrator actively evaluating 20 Himalayan catchments simultaneously...
                </p>
                <p className="text-xs text-slate-400 font-mono">
                  IngestionSentinel LoRaWAN auditing &bull; HydrologyReasoner GSI I-D slope physics &bull; DispatchCommander
                </p>
              </div>
            )}
          </div>
        )}

        {/* FOOTER */}
        <div className="border-t border-[#2d3744] bg-[#1c232d] px-4 py-2.5 flex items-center justify-between text-xs text-slate-400">
          <div className="font-mono text-[11px]">
            Target Ward: <span className="text-slate-200">{currentWard?.ward_name || selectedWardId}</span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded bg-[#212934] hover:bg-[#2d3744] border border-[#2d3744] text-slate-200 font-mono text-xs transition-colors focus-visible:ring-2 focus-visible:ring-[#0284c7]"
          >
            Close Console (Esc)
          </button>
        </div>
      </div>
    </div>
  );
};
