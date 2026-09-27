import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Header } from './components/Header';
import { MapChoropleth } from './components/MapChoropleth';
import { WardDetailPanel } from './components/WardDetailPanel';
import { TimeSeriesChart } from './components/TimeSeriesChart';
import { ValidationEventsModal } from './components/ValidationEventsModal';
import { ModelCardModal } from './components/ModelCardModal';
import { SitRepModal } from './components/SitRepModal';
import { SearchPalette } from './components/SearchPalette';
import { SimulationSandbox } from './components/SimulationSandbox';
import { DigitalTwinControls } from './components/DigitalTwinControls';
import { IoTSensorsModal } from './components/IoTSensorsModal';
import { AlertsAuditModal } from './components/AlertsAuditModal';
import { RiverCascadeModal } from './components/RiverCascadeModal';
import { CAPModal } from './components/CAPModal';
import { ExportDataModal } from './components/ExportDataModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { AgentTriageModal } from './components/AgentTriageModal';
import { CitizenReportModal } from './components/CitizenReportModal';
import { TopographicElevationRibbon } from './components/TopographicElevationRibbon';
import { alertBroadcaster } from './utils/audioAlert';
import { liveAnnouncer } from './utils/announcer';
import { useLiveTelemetry } from './hooks/useLiveTelemetry';
import { DIGITAL_TWIN_STEPS, applyDigitalTwinStep } from './services/digitalTwinSimulator';
import {
  WardRisk,
  ValidationEvent,
  ModelInfo,
  TimeSeriesPoint,
  SitRepData,
  SensorNode,
  HazardReport
} from './types';
import { Filter, RefreshCw, SlidersHorizontal, Volume2, Clock, ChevronLeft, Map, Activity, AlertTriangle, Bot, Send, BarChart3 } from 'lucide-react';

export const App: React.FC = () => {
  const { t } = useTranslation();

  // Core State
  const [wards, setWards] = useState<WardRisk[]>([]);
  const [baselineWards, setBaselineWards] = useState<WardRisk[]>([]);
  const [baselineSensors, setBaselineSensors] = useState<SensorNode[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All');
  const [selectedWardId, setSelectedWardId] = useState<string>('HP-MND-02'); // Default: Thunag (Seraj Basin)
  const [selectedWardDetail, setSelectedWardDetail] = useState<WardRisk | null>(null);
  const [geoJsonData, setGeoJsonData] = useState<any>(null);
  const [historyPoints, setHistoryPoints] = useState<TimeSeriesPoint[]>([]);
  const [validationEvents, setValidationEvents] = useState<ValidationEvent[]>([]);
  const [sitrep, setSitrep] = useState<SitRepData | null>(null);
  const [sensors, setSensors] = useState<SensorNode[]>([]);
  const [reports, setReports] = useState<HazardReport[]>([]);
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);

  // Responsive Mobile Tab Controller ('all' | 'map' | 'ward' | 'hydrograph')
  const [mobileTab, setMobileTab] = useState<'all' | 'map' | 'ward' | 'hydrograph'>('all');

  // Modals & Panels State
  const [isValidationOpen, setIsValidationOpen] = useState(false);
  const [isModelCardOpen, setIsModelCardOpen] = useState(false);
  const [isSitRepOpen, setIsSitRepOpen] = useState(false);
  const [isSensorsOpen, setIsSensorsOpen] = useState(false);
  const [isAlertsAuditOpen, setIsAlertsAuditOpen] = useState(false);
  const [isRiverCascadeOpen, setIsRiverCascadeOpen] = useState(false);
  const [isCAPOpen, setIsCAPOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isAgentTriageOpen, setIsAgentTriageOpen] = useState(false);
  const [isCitizenReportOpen, setIsCitizenReportOpen] = useState(false);
  const [showSandbox, setShowSandbox] = useState(false);
  const [showDigitalTwin, setShowDigitalTwin] = useState(false);
  const [twinStepIndex, setTwinStepIndex] = useState(0);
  const [isSimulatingTwin, setIsSimulatingTwin] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Live SSE Telemetry Stream Hook
  const { isConnected: isSSEConnected, streamingSensors } = useLiveTelemetry(sensors);
  const activeSensors = isSimulatingTwin ? sensors : (streamingSensors.length > 0 ? streamingSensors : sensors);

  // Accessibility States
  const [isHighContrast, setIsHighContrast] = useState<boolean>(() => {
    return localStorage.getItem('rakshak_high_contrast') === 'true';
  });
  const [textScale, setTextScale] = useState<'normal' | 'large' | 'xlarge'>(() => {
    return (localStorage.getItem('rakshak_text_scale') as 'normal' | 'large' | 'xlarge') || 'normal';
  });
  const [activeCaption, setActiveCaption] = useState<string | null>(null);

  // Apply High-Contrast Mode
  useEffect(() => {
    document.documentElement.classList.toggle('high-contrast', isHighContrast);
    localStorage.setItem('rakshak_high_contrast', String(isHighContrast));
  }, [isHighContrast]);

  // Apply Text Scaling
  useEffect(() => {
    document.documentElement.classList.remove('text-scale-large', 'text-scale-xlarge');
    if (textScale === 'large') {
      document.documentElement.classList.add('text-scale-large');
    } else if (textScale === 'xlarge') {
      document.documentElement.classList.add('text-scale-xlarge');
    }
    localStorage.setItem('rakshak_text_scale', textScale);
  }, [textScale]);

  // Subscribe to voice alert broadcasts for Live Closed Captions
  useEffect(() => {
    const unsubscribe = alertBroadcaster.onCaptionChange((text) => {
      setActiveCaption(text);
    });
    return unsubscribe;
  }, []);

  const handleCycleTextScale = () => {
    setTextScale(prev => {
      const next = prev === 'normal' ? 'large' : prev === 'large' ? 'xlarge' : 'normal';
      liveAnnouncer.announce(`Text scale changed to ${next}`, 'polite');
      return next;
    });
  };

  const handleToggleHighContrast = () => {
    setIsHighContrast(prev => {
      const next = !prev;
      liveAnnouncer.announce(next ? 'High contrast mode enabled' : 'High contrast mode disabled', 'polite');
      return next;
    });
  };

  // Global Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName);

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      } else if (e.altKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        setIsHighContrast(prev => !prev);
      } else if (e.altKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        handleCycleTextScale();
      } else if (e.altKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        setIsSitRepOpen(prev => !prev);
      } else if (e.altKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setIsAgentTriageOpen(prev => !prev);
      } else if (e.key === '?' && !isInput) {
        e.preventDefault();
        setIsShortcutsOpen(prev => !prev);
      } else if (!isInput && e.key >= '1' && e.key <= '4') {
        const dists = ['All', 'Mandi', 'Kullu', 'Kangra'];
        const idx = parseInt(e.key, 10) - 1;
        if (dists[idx]) {
          setSelectedDistrict(dists[idx]);
        }
      } else if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsValidationOpen(false);
        setIsModelCardOpen(false);
        setIsSitRepOpen(false);
        setIsSensorsOpen(false);
        setIsAlertsAuditOpen(false);
        setIsRiverCascadeOpen(false);
        setIsCAPOpen(false);
        setIsExportOpen(false);
        setIsShortcutsOpen(false);
        setIsAgentTriageOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 1. Initial Data Fetch
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Wards summaries
        const wardsRes = await fetch('/api/v1/risk/all');
        const wardsData = await wardsRes.json();
        setWards(wardsData);
        setBaselineWards(wardsData);

        // GeoJSON boundaries
        const geoRes = await fetch('/api/v1/wards/geojson');
        const geoData = await geoRes.json();
        setGeoJsonData(geoData);

        // Validation events
        const eventsRes = await fetch('/api/v1/events/validation');
        const eventsData = await eventsRes.json();
        setValidationEvents(eventsData);

        // SitRep
        const sitrepRes = await fetch('/api/v1/sitrep');
        if (sitrepRes.ok) {
          const sitrepData = await sitrepRes.json();
          setSitrep(sitrepData);
        }

        // Sensors Telemetry Stream
        const sensorsRes = await fetch('/api/v1/sensors');
        if (sensorsRes.ok) {
          const sensorsData = await sensorsRes.json();
          setSensors(sensorsData);
          setBaselineSensors(sensorsData);
        }

        // Model Card Info
        const modelRes = await fetch('/api/v1/model/info');
        const modelData = await modelRes.json();
        setModelInfo(modelData);

        // Citizen Hazard Reports
        const reportsRes = await fetch('/api/v1/reports');
        if (reportsRes.ok) {
          const reportsData = await reportsRes.json();
          setReports(reportsData);
        }
      } catch (err) {
        console.error('Failed to initialize dashboard data:', err);
      }
    };

    fetchData();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await fetch('/api/v1/reports');
      if (res.ok) {
        const data = await res.json();
        setReports(data);
      }

      // Re-fetch wards to update risk scores if boosted
      const wardsRes = await fetch('/api/v1/risk/all');
      if (wardsRes.ok) {
        const wardsData = await wardsRes.json();
        setWards(wardsData);
      }
    } catch (e) {
      console.error('Failed to refresh reports:', e);
    }
  };

  const handleVerifyReport = async (reportId: string, action: 'verify' | 'reject') => {
    try {
      const res = await fetch(`/api/v1/reports/${reportId}/verify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, officer_id: 'OFFICER-NDRF-01' })
      });
      if (res.ok) {
        fetchReports();
      }
    } catch (err) {
      console.error('Failed to verify report:', err);
    }
  };

  // 2. Fetch Detailed Ward and Time-series on Selection
  useEffect(() => {
    if (!selectedWardId) return;

    const fetchWardDetails = async () => {
      try {
        const detailRes = await fetch(`/api/v1/risk/${selectedWardId}`);
        if (detailRes.ok) {
          const detail = await detailRes.json();
          setSelectedWardDetail(detail);
          liveAnnouncer.announce(
            `Selected ward: ${detail.ward_name}. Risk score: ${detail.risk_score} of 100. Alert level: ${detail.alert_level}. Lead time: ${detail.lead_time_hours} hours.`,
            'polite'
          );
        }

        const histRes = await fetch(`/api/v1/history/${selectedWardId}?hours=48`);
        if (histRes.ok) {
          const hist = await histRes.json();
          setHistoryPoints(hist.points);
        }
      } catch (err) {
        console.error('Failed to fetch ward detail/history:', err);
      }
    };

    fetchWardDetails();
  }, [selectedWardId]);

  // Handle Manual Data Refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const wardsRes = await fetch('/api/v1/risk/all');
      const wardsData = await wardsRes.json();
      setWards(wardsData);
      setBaselineWards(wardsData);

      if (selectedWardId) {
        const detailRes = await fetch(`/api/v1/risk/${selectedWardId}`);
        if (detailRes.ok) {
          const detail = await detailRes.json();
          setSelectedWardDetail(detail);
        }
      }

      const sitrepRes = await fetch('/api/v1/sitrep');
      if (sitrepRes.ok) {
        const sitrepData = await sitrepRes.json();
        setSitrep(sitrepData);
      }

      const sensorsRes = await fetch('/api/v1/sensors');
      if (sensorsRes.ok) {
        const sensorsData = await sensorsRes.json();
        setSensors(sensorsData);
        setBaselineSensors(sensorsData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsRefreshing(false);
    }
  };

  // 4D Digital Twin Simulation Step Change Handler
  const handleTwinStepChange = (index: number) => {
    setTwinStepIndex(index);
    setIsSimulatingTwin(true);
    const baseWards = baselineWards.length > 0 ? baselineWards : wards;
    const baseSensors = baselineSensors.length > 0 ? baselineSensors : sensors;
    const step = DIGITAL_TWIN_STEPS[index];
    const { updatedWards, updatedSensors } = applyDigitalTwinStep(baseWards, step, baseSensors);
    setWards(updatedWards);
    setSensors(updatedSensors);

    if (selectedWardId) {
      const matched = updatedWards.find(w => w.ward_id === selectedWardId);
      if (matched) setSelectedWardDetail(matched);
    }
  };

  // Reset Digital Twin to Real-time Ingestion
  const handleResetDigitalTwin = async () => {
    setIsSimulatingTwin(false);
    setTwinStepIndex(0);
    if (baselineWards.length > 0) {
      setWards(baselineWards);
    }
    if (baselineSensors.length > 0) {
      setSensors(baselineSensors);
    }
    await handleRefresh();
  };

  // Trigger Emergency Alert
  const handleTriggerAlert = async (wardId: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/v1/alerts/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ward_id: wardId })
      });
      return res.ok;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  // Simulate Cloudburst Surge for testing
  const handleSimulateSurge = async (wardId: string) => {
    try {
      // Derive sensor node_id from ward_id using backend naming convention:
      // HP-MND-01 -> ESP32-MND-01, HP-KLU-01 -> ESP32-KLU-01, etc.
      const loc = wardId.substring(3, 6);   // MND, KLU, KNG
      const num = wardId.substring(7, 9);   // 01, 02, etc.
      const nodeId = `ESP32-${loc}-${num}`;
      await fetch('/api/v1/ingest/sensor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          node_id: nodeId,
          ward_id: wardId,
          source: 'sensor',
          water_level_cm: 475.0,
          water_level_rate_cm_per_hr: 52.0,
          tilt_angle_deg: 8.2,
          battery_level_pct: 90.0
        })
      });
      await handleRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  // Apply What-If Simulation Sandbox across all wards
  const handleApplySimulation = (simRain24h: number, simRain72h: number) => {
    setWards((prevWards) =>
      prevWards.map((w) => {
        const slopeFactor = w.latitude ? 1.1 : 1.0;
        const simulatedScore = Math.min(
          100.0,
          Math.max(
            15.0,
            (simRain24h / 180.0) * 65.0 + (simRain72h / 250.0) * 35.0 * slopeFactor
          )
        );

        let alert_level: 'NORMAL' | 'ADVISORY' | 'WATCH' | 'WARNING' = 'NORMAL';
        let alert_color = '#10b981';

        if (simulatedScore >= 80) {
          alert_level = 'WARNING';
          alert_color = '#ef4444';
        } else if (simulatedScore >= 60) {
          alert_level = 'WATCH';
          alert_color = '#f97316';
        } else if (simulatedScore >= 40) {
          alert_level = 'ADVISORY';
          alert_color = '#eab308';
        }

        return {
          ...w,
          risk_score: Number(simulatedScore.toFixed(1)),
          alert_level,
          alert_color,
          rainfall_current_24h: simRain24h,
          rainfall_antecedent_72h: simRain72h,
          lead_time_hours: simulatedScore > 75 ? 2.5 : 8.0
        };
      })
    );

    if (selectedWardDetail) {
      setSelectedWardDetail((prev) =>
        prev
          ? {
              ...prev,
              risk_score: simRain24h > 150 ? 95.5 : 45.0,
              alert_level: simRain24h > 150 ? 'WARNING' : 'ADVISORY',
              alert_color: simRain24h > 150 ? '#ef4444' : '#eab308',
              rainfall_current_24h: simRain24h,
              rainfall_antecedent_72h: simRain72h
            }
          : null
      );
    }
  };

  // Filtered wards by district
  const filteredWards = selectedDistrict === 'All'
    ? wards
    : wards.filter(w => w.district_name.toLowerCase() === selectedDistrict.toLowerCase());

  // Top KPIs
  const totalWards = wards.length;
  const criticalCount = wards.filter(w => w.alert_level === 'WARNING' || w.alert_level === 'WATCH').length;
  const meanScore = wards.length > 0
    ? (wards.reduce((acc, w) => acc + w.risk_score, 0) / wards.length).toFixed(1)
    : '0';

  return (
    <div className="min-h-screen bg-[#f4f6f8] text-slate-800 flex flex-col font-sans">
      {/* Accessible Skip Link (WCAG 2.4.1) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2.5 focus:bg-amber-500 focus:text-white focus:font-bold focus:rounded-lg focus:shadow-2xl focus:ring-4 focus:ring-amber-500 focus:outline-none text-sm transition-all"
      >
        Skip to main emergency dashboard
      </a>

      {/* Closed Captions Banner for Spoken Voice Directive (WCAG 1.2.2) */}
      {activeCaption && (
        <aside
          aria-live="assertive"
          aria-atomic="true"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-2xl w-[92%] bg-slate-900/95 border border-amber-500 rounded-2xl px-5 py-3.5 shadow-2xl flex items-center gap-3 backdrop-blur-md animate-fadeIn"
          role="status"
        >
          <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0 animate-pulse">
            <Volume2 className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] uppercase font-mono tracking-wider text-amber-400 font-bold">
              Emergency Voice Broadcast (Closed Caption)
            </p>
            <p className="text-white font-medium text-sm sm:text-base leading-snug">
              {activeCaption}
            </p>
          </div>
          <button
            onClick={() => setActiveCaption(null)}
            className="text-slate-400 hover:text-white text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
            aria-label="Dismiss closed caption"
          >
            Dismiss
          </button>
        </aside>
      )}

      {/* Tactical App Header */}
      <Header
        onOpenModelCard={() => setIsModelCardOpen(true)}
        onOpenValidation={() => setIsValidationOpen(true)}
        onOpenSitRep={() => setIsSitRepOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenSensors={() => setIsSensorsOpen(true)}
        onOpenAlertsAudit={() => setIsAlertsAuditOpen(true)}
        onOpenRiverCascade={() => setIsRiverCascadeOpen(true)}
        onOpenCAP={() => setIsCAPOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        activeSensorsCount={activeSensors.length || 4}
        isHighContrast={isHighContrast}
        onToggleHighContrast={handleToggleHighContrast}
        textScale={textScale}
        onCycleTextScale={handleCycleTextScale}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onOpenAgentTriage={() => setIsAgentTriageOpen(true)}
        onOpenCitizenReport={() => setIsCitizenReportOpen(true)}
      />

      {/* Main Content Area */}
      <main id="main-content" tabIndex={-1} className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 pb-20 lg:pb-6 space-y-4 focus:outline-none" role="main">
        {/* Commusoft Signature Callout Warning Banner */}
        <div className="bg-[#fff7ed] border border-[#fed7aa] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[#9a3412] shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#ea580c]/15 text-[#ea580c] flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-[#ea580c]" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#ea580c]">
                Catchment Advisory Notice • Mandi & Kullu Basins
              </div>
              <p className="text-sm font-medium text-slate-700 mt-0.5">
                Elevated runoff velocity detected in Seraj & Parbati river corridors. Flood monitoring telemetry active.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setIsAgentTriageOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-[#ea580c] hover:bg-[#c2410c] text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              View Multi-Agent Triage
            </button>
            <button
              onClick={() => setIsSitRepOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-white border border-[#fed7aa] hover:bg-orange-50/60 text-[#9a3412] text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              SitRep Brief
            </button>
          </div>
        </div>

        {/* Commusoft White Card: District Selector & Operations Strip */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 text-left shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* District Filter Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap overflow-x-auto pb-1 lg:pb-0" role="tablist" aria-label="District Filter">
            <div className="flex items-center gap-1 text-slate-500 mr-2 text-xs font-semibold flex-shrink-0">
              <Filter className="w-3.5 h-3.5 text-[#064244]" aria-hidden="true" />
              <span>Sector:</span>
            </div>
            {['All', 'Mandi', 'Kullu', 'Kangra'].map((dist, idx) => (
              <button
                key={dist}
                role="tab"
                aria-selected={selectedDistrict === dist}
                onClick={() => setSelectedDistrict(dist)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#064244] cursor-pointer ${
                  selectedDistrict === dist
                    ? 'bg-[#064244] text-white shadow-sm'
                    : 'bg-slate-100/90 hover:bg-slate-200/80 text-slate-700 border border-slate-200/70'
                }`}
                aria-label={`Filter by ${dist} District (Press ${idx + 1})`}
              >
                {dist === 'All' ? t('all_districts') : `${dist} Sector`}
                <span className="sr-only">, shortcut key {idx + 1}</span>
              </button>
            ))}
          </div>

          {/* KPI Metrics & Simulation Toggles */}
          <div className="flex items-center flex-wrap gap-4 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase tracking-wider font-semibold">Monitored</span>
              <strong className="text-sm text-slate-900 font-bold tabular-nums">{totalWards} Wards</strong>
            </div>

            <div className="border-l border-slate-200 pl-3">
              <span className="text-slate-400 block text-[10px] uppercase tracking-wider font-semibold">Watch / Warning</span>
              <strong className="text-sm text-[#ef4444] font-bold tabular-nums flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#ef4444] animate-ping" />
                {criticalCount} Active
              </strong>
            </div>

            <div className="border-l border-slate-200 pl-3">
              <span className="text-slate-400 block text-[10px] uppercase tracking-wider font-semibold">Mean Catchment Risk</span>
              <strong className="text-sm text-[#ea580c] font-bold tabular-nums">{meanScore} <span className="text-xs text-slate-400 font-normal">/ 100</span></strong>
            </div>

            {/* SSE Live Telemetry Feed Badge */}
            <div className="flex items-center space-x-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800">
              <span className={`w-2 h-2 rounded-full ${isSSEConnected ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-slate-400'}`} />
              <span className="hidden sm:inline tracking-wide">{isSSEConnected ? 'SSE Live' : 'Telemetry Link'}</span>
            </div>

            {/* 4D Digital Twin Time-Lapse Toggle */}
            <button
              onClick={() => {
                setShowDigitalTwin(!showDigitalTwin);
                if (showSandbox) setShowSandbox(false);
              }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#064244] ${
                showDigitalTwin
                  ? 'bg-[#064244] border-[#064244] text-white shadow-sm'
                  : 'bg-slate-100/90 border-slate-200 text-slate-700 hover:bg-slate-200/80'
              }`}
              aria-expanded={showDigitalTwin}
            >
              <Clock className={`w-3.5 h-3.5 ${showDigitalTwin ? 'text-emerald-300' : 'text-[#064244]'}`} />
              <span>4D Digital Twin</span>
            </button>

            {/* Sandbox Simulation Toggle */}
            <button
              onClick={() => {
                setShowSandbox(!showSandbox);
                if (showDigitalTwin) setShowDigitalTwin(false);
              }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ea580c] ${
                showSandbox
                  ? 'bg-[#ea580c] border-[#ea580c] text-white shadow-sm'
                  : 'bg-slate-100/90 border-slate-200 text-slate-700 hover:bg-slate-200/80'
              }`}
              aria-expanded={showSandbox}
              aria-controls="simulation-sandbox-panel"
            >
              <SlidersHorizontal className={`w-3.5 h-3.5 ${showSandbox ? 'text-amber-200' : 'text-[#ea580c]'}`} aria-hidden="true" />
              <span className="hidden sm:inline">Simulate Surge</span>
              <span className="sm:hidden">Simulate</span>
            </button>

            {/* Refresh Feeds */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-xl bg-slate-100/90 border border-slate-200 hover:bg-slate-200/80 text-slate-700 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#064244]"
              title="Refresh Ingestion Feeds"
              aria-label="Refresh Satellite and Ingestion Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#064244]' : 'text-slate-600'}`} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* 4D Digital Twin Simulator Controls (Collapsible) */}
        {showDigitalTwin && (
          <div className="animate-fadeIn">
            <DigitalTwinControls
              currentStepIndex={twinStepIndex}
              onStepChange={handleTwinStepChange}
              onResetToLive={handleResetDigitalTwin}
              isSimulating={isSimulatingTwin}
            />
          </div>
        )}

        {/* Simulation Sandbox (Collapsible) */}
        {showSandbox && (
          <div id="simulation-sandbox-panel" className="animate-fadeIn">
            <SimulationSandbox
              onApplySimulation={handleApplySimulation}
              onReset={handleRefresh}
            />
          </div>
        )}

        {/* Mobile Segmented View Switcher (Visible on < lg screens) */}
        <div className="lg:hidden flex items-center justify-between p-1.5 bg-white border border-slate-200/90 rounded-2xl overflow-x-auto text-xs shadow-sm gap-1.5">
          <button
            onClick={() => setMobileTab('all')}
            className={`flex-1 py-2 px-3 rounded-xl text-center transition-all min-h-[42px] whitespace-nowrap font-semibold flex items-center justify-center gap-1.5 cursor-pointer ${
              mobileTab === 'all'
                ? 'bg-[#064244] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 bg-slate-50'
            }`}
          >
            All Views
          </button>
          <button
            onClick={() => setMobileTab('map')}
            className={`flex-1 py-2 px-3 rounded-xl text-center transition-all min-h-[42px] whitespace-nowrap font-semibold flex items-center justify-center gap-1.5 cursor-pointer ${
              mobileTab === 'map'
                ? 'bg-[#064244] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 bg-slate-50'
            }`}
          >
            <Map className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Map</span>
          </button>
          <button
            onClick={() => setMobileTab('ward')}
            className={`flex-1 py-2 px-3 rounded-xl text-center transition-all min-h-[42px] whitespace-nowrap font-semibold flex items-center justify-center gap-1.5 cursor-pointer ${
              mobileTab === 'ward'
                ? 'bg-[#064244] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 bg-slate-50'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
            <span>Intel</span>
            {selectedWardDetail && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse ml-0.5" />
            )}
          </button>
          <button
            onClick={() => setMobileTab('hydrograph')}
            className={`flex-1 py-2 px-3 rounded-xl text-center transition-all min-h-[42px] whitespace-nowrap font-semibold flex items-center justify-center gap-1.5 cursor-pointer ${
              mobileTab === 'hydrograph'
                ? 'bg-[#064244] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 bg-slate-50'
            }`}
          >
            Charts
          </button>
        </div>

        {/* Tactical Map and Detail Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Choropleth Map with Satellite Imagery (Left 7 Cols) */}
          <div className={`lg:col-span-7 ${mobileTab === 'all' || mobileTab === 'map' ? 'block' : 'hidden lg:block'} space-y-3`}>
            <MapChoropleth
              wards={filteredWards}
              selectedWard={selectedWardDetail}
              onSelectWard={(wardId) => setSelectedWardId(wardId)}
              validationEvents={validationEvents}
              geoJsonData={geoJsonData}
              sensors={activeSensors}
              reports={reports}
              onVerifyReport={handleVerifyReport}
            />

            {/* Mobile Map Active Ward Banner */}
            {selectedWardDetail && mobileTab === 'map' && (
              <div className="lg:hidden bg-[#1c232d] border border-[#2d3744] p-2.5 rounded shadow-lg flex items-center justify-between gap-3 animate-fadeIn">
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedWardDetail.alert_color }} />
                    <span>{selectedWardDetail.ward_name}</span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400">
                    Risk: <strong className="text-[#b45309]">{selectedWardDetail.risk_score.toFixed(0)}/100</strong> • Lead Time: <strong className="text-[#0284c7]">{selectedWardDetail.lead_time_hours}h</strong>
                  </div>
                </div>
                <button
                  onClick={() => setMobileTab('ward')}
                  className="px-2.5 py-1 rounded bg-[#0284c7] text-white font-bold text-xs font-mono min-h-[34px] whitespace-nowrap"
                >
                  Inspect Ward
                </button>
              </div>
            )}
          </div>

          {/* Granular Ward Detail & Explainability (Right 5 Cols) */}
          <div className={`lg:col-span-5 ${mobileTab === 'all' || mobileTab === 'ward' ? 'block' : 'hidden lg:block'} space-y-3`}>
            {/* Mobile Back Button when in dedicated ward view */}
            {mobileTab === 'ward' && (
              <div className="lg:hidden flex items-center justify-between pb-1">
                <button
                  onClick={() => setMobileTab('map')}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded bg-[#212934] text-slate-200 text-xs font-mono border border-[#2d3744]"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back to Map View</span>
                </button>
                <span className="text-[10px] font-mono text-slate-400 uppercase">
                  {selectedWardDetail?.district_name} District
                </span>
              </div>
            )}

            <WardDetailPanel
              ward={selectedWardDetail}
              onTriggerAlert={handleTriggerAlert}
              onSimulateSurge={handleSimulateSurge}
              onSelectSector={(wardId) => setSelectedWardId(wardId)}
            />
          </div>
        </div>

        {/* The Single Bold Centerpiece: Topographic Hydraulic Elevation Ribbon */}
        <div className={mobileTab === 'all' || mobileTab === 'map' ? 'block' : 'hidden lg:block'}>
          <TopographicElevationRibbon
            selectedWardId={selectedWardId}
            onSelectWard={(wardId) => setSelectedWardId(wardId)}
          />
        </div>

        {/* Time-Series Dynamic Hydrograph */}
        <div className={mobileTab === 'all' || mobileTab === 'hydrograph' ? 'block' : 'hidden lg:block'}>
          {mobileTab === 'hydrograph' && (
            <div className="lg:hidden flex items-center justify-between pb-2">
              <button
                onClick={() => setMobileTab('map')}
                className="flex items-center space-x-1 px-2.5 py-1 rounded bg-[#212934] text-slate-200 text-xs font-mono border border-[#2d3744]"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back to Map View</span>
              </button>
            </div>
          )}

          <TimeSeriesChart
            points={historyPoints}
            wardName={selectedWardDetail?.ward_name || 'Selected Ward'}
          />
        </div>
      </main>

      {/* Native Mobile Sticky Hybrid Navigation Dock */}
      <nav
        aria-label="Mobile Navigation Dock"
        className="fixed bottom-0 left-0 right-0 z-40 bg-[#064244] border-t border-[#043335] lg:hidden flex items-center justify-around py-1.5 px-2 shadow-2xl text-white backdrop-blur-md bg-opacity-95"
      >
        <button
          onClick={() => setMobileTab('map')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer min-h-[44px] ${
            mobileTab === 'map' ? 'text-amber-400 font-bold bg-[#043335]' : 'text-teal-100 hover:text-white'
          }`}
        >
          <Map className="w-5 h-5" />
          <span className="text-[10px] font-sans mt-0.5">Map</span>
        </button>

        <button
          onClick={() => setMobileTab('ward')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer min-h-[44px] ${
            mobileTab === 'ward' ? 'text-amber-400 font-bold bg-[#043335]' : 'text-teal-100 hover:text-white'
          }`}
        >
          <Activity className="w-5 h-5" />
          <span className="text-[10px] font-sans mt-0.5">Intel</span>
        </button>

        <button
          onClick={() => setIsAgentTriageOpen(true)}
          className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-teal-100 hover:text-white transition-all cursor-pointer min-h-[44px]"
        >
          <Bot className="w-5 h-5 text-emerald-400" />
          <span className="text-[10px] font-sans mt-0.5">AI Triage</span>
        </button>

        <button
          onClick={() => setIsCitizenReportOpen(true)}
          className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-amber-300 font-bold transition-all cursor-pointer min-h-[44px]"
        >
          <Send className="w-5 h-5 text-amber-400" />
          <span className="text-[10px] font-sans mt-0.5">Report</span>
        </button>

        <button
          onClick={() => setMobileTab('hydrograph')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer min-h-[44px] ${
            mobileTab === 'hydrograph' ? 'text-amber-400 font-bold bg-[#043335]' : 'text-teal-100 hover:text-white'
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          <span className="text-[10px] font-sans mt-0.5">Charts</span>
        </button>
      </nav>

      {/* Commusoft SaaS Footer */}
      <footer className="border-t border-slate-200/80 py-4 px-6 text-xs text-slate-500 bg-white flex flex-col md:flex-row items-center justify-between gap-3 text-left shadow-sm mb-14 lg:mb-0">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse" />
          <span className="text-slate-800 font-bold tracking-wide">Rakshak SIH26192 Command Core</span>
          <span className="text-slate-300 hidden sm:inline">•</span>
          <span className="text-slate-500 hidden sm:inline">Ministry of Home Affairs / NDRF Early Warning Initiative</span>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-slate-500 font-mono">
          <span>Satellite DEM: <strong className="text-slate-700 font-semibold">SRTM 30m</strong></span>
          <span>Hydrology: <strong className="text-slate-700 font-semibold">CWC Manning-GSI</strong></span>
          <span className="text-[#064244] font-semibold">31.7088° N • 76.9320° E</span>
        </div>
      </footer>

      {/* Modals & Dialogs */}
      <ValidationEventsModal
        isOpen={isValidationOpen}
        onClose={() => setIsValidationOpen(false)}
        events={validationEvents}
        onSelectWard={(wardId) => setSelectedWardId(wardId)}
      />

      <ModelCardModal
        isOpen={isModelCardOpen}
        onClose={() => setIsModelCardOpen(false)}
        modelInfo={modelInfo}
      />

      <SitRepModal
        isOpen={isSitRepOpen}
        onClose={() => setIsSitRepOpen(false)}
        sitrep={sitrep}
      />

      <IoTSensorsModal
        isOpen={isSensorsOpen}
        onClose={() => setIsSensorsOpen(false)}
        sensors={activeSensors}
        onSelectWard={(wardId) => setSelectedWardId(wardId)}
        onSimulateSurge={handleSimulateSurge}
        onRefreshSensors={handleRefresh}
      />

      <AlertsAuditModal
        isOpen={isAlertsAuditOpen}
        onClose={() => setIsAlertsAuditOpen(false)}
      />

      <RiverCascadeModal
        isOpen={isRiverCascadeOpen}
        onClose={() => setIsRiverCascadeOpen(false)}
        onSelectWard={(wardId) => setSelectedWardId(wardId)}
      />

      <CAPModal
        isOpen={isCAPOpen}
        onClose={() => setIsCAPOpen(false)}
      />

      <ExportDataModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        wards={wards}
        geoJsonData={geoJsonData}
      />

      <SearchPalette
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        wards={wards}
        onSelectWard={(wardId) => setSelectedWardId(wardId)}
      />

      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      <AgentTriageModal
        isOpen={isAgentTriageOpen}
        onClose={() => setIsAgentTriageOpen(false)}
        selectedWardId={selectedWardId}
        wards={wards}
        onSelectWard={(wardId) => setSelectedWardId(wardId)}
      />

      <CitizenReportModal
        isOpen={isCitizenReportOpen}
        onClose={() => setIsCitizenReportOpen(false)}
        wards={wards}
        onReportSubmitted={fetchReports}
      />
    </div>
  );
};
