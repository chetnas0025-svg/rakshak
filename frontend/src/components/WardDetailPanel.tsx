import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  Clock,
  CloudRain,
  Mountain,
  Layers,
  Send,
  Radio,
  CheckCircle2,
  Info,
  Volume2,
  Activity,
  Gauge
} from 'lucide-react';
import { WardRisk } from '../types';
import { alertBroadcaster } from '../utils/audioAlert';

interface WardDetailProps {
  ward: WardRisk | null;
  onTriggerAlert: (wardId: string) => Promise<boolean>;
  onSimulateSurge: (wardId: string) => void;
  onSelectSector?: (wardId: string) => void;
}

export const WardDetailPanel: React.FC<WardDetailProps> = ({
  ward,
  onTriggerAlert,
  onSimulateSurge,
  onSelectSector
}) => {
  const { t, i18n } = useTranslation();
  const [isSending, setIsSending] = useState(false);
  const [alertSent, setAlertSent] = useState(false);
  const [surgeSimulated, setSurgeSimulated] = useState(false);

  if (!ward) {
    return (
      <div
        role="region"
        aria-label="Ward Details Empty State"
        className="p-5 flex flex-col justify-between h-[580px] bg-white border border-slate-200/90 rounded-2xl text-left shadow-sm"
      >
        <div className="space-y-3">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-2.5">
            <Info className="w-4 h-4 text-[#064244]" />
            <h3 className="font-bold text-sm text-slate-900">
              Station Ledger • Inactive Selection
            </h3>
          </div>
          <p className="text-xs text-slate-600 font-sans leading-relaxed">
            No hydrological monitoring ward is currently active in the inspector. To initiate telemetry and risk triage:
          </p>
          <ol className="text-xs text-slate-500 font-sans space-y-2 list-decimal list-inside pl-1">
            <li>Select any polygon on the GIS map on the left.</li>
            <li>Use the Search palette (<kbd className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 font-mono">Ctrl+K</kbd>) to search by tehsil name.</li>
            <li>Or load an active mountain catchment sector below:</li>
          </ol>
        </div>

        {/* Quick Sector Selector Buttons for immediate triage */}
        <div className="space-y-2 pt-4 border-t border-slate-100">
          <span className="text-[11px] uppercase font-semibold text-slate-500 block">
            Priority Catchment Corridors:
          </span>
          <div className="grid grid-cols-1 gap-2 text-xs font-medium">
            <button
              onClick={() => onSelectSector?.('HP-MND-02')}
              className="px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left text-slate-800 flex justify-between items-center transition-colors cursor-pointer"
            >
              <span>HP-MND-02: Thunag (Seraj Basin)</span>
              <span className="text-[11px] text-red-600 font-bold">82.4% Risk</span>
            </button>
            <button
              onClick={() => onSelectSector?.('HP-MND-01')}
              className="px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left text-slate-800 flex justify-between items-center transition-colors cursor-pointer"
            >
              <span>HP-MND-01: Mandi Sadar (Beas)</span>
              <span className="text-[11px] text-amber-600 font-bold">58.0% Risk</span>
            </button>
            <button
              onClick={() => onSelectSector?.('HP-KLU-02')}
              className="px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left text-slate-800 flex justify-between items-center transition-colors cursor-pointer"
            >
              <span>HP-KLU-02: Manikaran (Parbati)</span>
              <span className="text-[11px] text-red-600 font-bold">76.8% Risk</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleDispatch = async () => {
    setIsSending(true);

    // Trigger local acoustic siren and voice alert
    alertBroadcaster.playAlertChime('warning');
    const voiceText = i18n.language === 'hi'
      ? `सावधान। ${ward.ward_name} के लिए आकस्मिक बाढ़ की आपातकालीन चेतावनी जारी की गई है। नदी तटों और जलभराव क्षेत्रों से तुरंत दूर रहें।`
      : `Emergency warning for ${ward.ward_name}. Critical flash flood risk. Avoid riverside corridors and stay alert immediately.`;
    alertBroadcaster.speakDirective(voiceText, i18n.language as 'en' | 'hi');

    const success = await onTriggerAlert(ward.ward_id);
    setIsSending(false);
    if (success) {
      setAlertSent(true);
      setTimeout(() => setAlertSent(false), 6000);
    }
  };

  const handleSimulateSurgeClick = () => {
    onSimulateSurge(ward.ward_id);
    setSurgeSimulated(true);
    setTimeout(() => setSurgeSimulated(false), 4000);
  };

  const isBreached = ward.rainfall_current_24h >= 103.0;

  return (
    <div
      role="region"
      aria-label={`Detailed analysis for ${ward.ward_name}`}
      className="p-5 flex flex-col h-full overflow-y-auto space-y-4 bg-white border border-slate-200/90 rounded-2xl text-left shadow-sm"
    >
      {/* Header Info */}
      <div className="flex items-start justify-between border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {ward.ward_id}
            </span>
            <span className="text-xs text-slate-500 font-medium">{ward.district_name} District</span>
          </div>
          <h2 className="font-bold text-lg text-slate-900 mt-1 tracking-tight">
            {ward.ward_name}
          </h2>
        </div>

        {/* Alert Severity Badge */}
        <div
          className="px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider text-white flex items-center space-x-1.5 shadow-sm"
          style={{ backgroundColor: ward.alert_color }}
          role="status"
          aria-label={`Current threat level: ${ward.alert_level}`}
        >
          <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{ward.alert_level}</span>
        </div>
      </div>

      {/* Main Metric Blocks: Circular Risk Gauge & Lead Time */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Composite Risk Score Gauge */}
        <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-2xl flex items-center justify-between relative overflow-hidden">
          <div className="space-y-1 z-10">
            <div className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-[#064244]" />
              <span>{t('risk_score')}</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 flex items-baseline gap-1">
              <span style={{ color: ward.alert_color }}>{ward.risk_score.toFixed(1)}</span>
              <span className="text-xs text-slate-400 font-normal">/ 100</span>
            </div>
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full border inline-block"
              style={{
                borderColor: `${ward.alert_color}40`,
                color: ward.alert_color,
                backgroundColor: `${ward.alert_color}10`
              }}
            >
              {ward.alert_level}
            </span>
          </div>

          {/* SVG Circular Dial */}
          <div className="relative w-20 h-20 flex-shrink-0 flex items-center justify-center">
            <svg className="w-20 h-20 -rotate-90 transform" viewBox="0 0 80 80">
              {/* Background track */}
              <circle
                cx="40"
                cy="40"
                r="32"
                className="stroke-slate-200"
                strokeWidth="6"
                fill="transparent"
              />
              {/* Animated Progress Track */}
              <circle
                cx="40"
                cy="40"
                r="32"
                stroke={ward.alert_color}
                strokeWidth="6"
                strokeDasharray={201}
                strokeDashoffset={201 - (Math.min(100, Math.max(0, ward.risk_score)) / 100) * 201}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xs text-slate-800 font-bold">{Math.round(ward.risk_score)}%</span>
            </div>
          </div>
        </div>

        {/* Actionable Lead Time */}
        <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-2xl flex flex-col justify-between">
          <div className="text-xs font-semibold text-slate-500 flex items-center justify-between">
            <span className="flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-[#064244]" />
              <span>{t('lead_time')}</span>
            </span>
            <span className="text-[10px] text-amber-800 font-semibold px-2 py-0.5 rounded-full bg-amber-100 border border-amber-200">
              EVAC WINDOW
            </span>
          </div>
          <div className="text-2xl font-bold mt-1 text-slate-900">
            {ward.lead_time_hours.toFixed(1)}{' '}
            <span className="text-xs text-slate-400 font-normal">{t('hours')}</span>
          </div>
          <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-500">
            <span>Hydrological Crest:</span>
            <strong className="text-slate-800 font-semibold">
              {ward.lead_time_hours <= 3.0 ? 'IMMINENT (<3h)' : 'PRE-STAGE (3-6h)'}
            </strong>
          </div>
        </div>
      </div>

      {/* Hydro-Meteorological Attributes Strip */}
      <div className="grid grid-cols-3 gap-2.5 text-xs">
        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
          <div className="text-slate-500 text-[10px] font-semibold flex items-center gap-1">
            <CloudRain className="w-3 h-3 text-[#064244]" />
            <span>24h Rain</span>
          </div>
          <div className="font-bold text-slate-900 mt-0.5">{ward.rainfall_current_24h.toFixed(1)} mm</div>
        </div>

        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
          <div className="text-slate-500 text-[10px] font-semibold flex items-center gap-1">
            <Mountain className="w-3 h-3 text-[#ea580c]" />
            <span>Slope</span>
          </div>
          <div className="font-bold text-slate-900 mt-0.5">{ward.features_summary?.slope_deg || 28}°</div>
        </div>

        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
          <div className="text-slate-500 text-[10px] font-semibold flex items-center gap-1">
            <Layers className="w-3 h-3 text-slate-500" />
            <span>Elevation</span>
          </div>
          <div className="font-bold text-slate-900 mt-0.5">{ward.features_summary?.elevation_m || 1200} m</div>
        </div>
      </div>

      {/* 8-Factor Explainable AI Breakdown */}
      {ward.factor_contributions && ward.factor_contributions.length > 0 && (
        <div className="border border-slate-200/80 bg-slate-50 rounded-2xl p-3.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-[#064244]" />
              {t('factor_contributions')}
            </span>
            <span className="text-[10px] font-semibold text-slate-600 px-2 py-0.5 rounded-full bg-white border border-slate-200">
              8-Factor Model
            </span>
          </div>

          <div className="space-y-2">
            {ward.factor_contributions.slice(0, 5).map((fc) => (
              <div key={fc.factor_name} className="text-xs">
                <div className="flex justify-between text-[11px] mb-0.5">
                  <span className="text-slate-700 font-medium">{fc.display_name}</span>
                  <span className={fc.is_aggravating ? 'text-red-600 font-bold' : 'text-slate-500 font-semibold'}>
                    +{fc.impact_points.toFixed(1)} pts
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 rounded-full ${
                      fc.is_aggravating ? 'bg-red-500' : 'bg-[#064244]'
                    }`}
                    style={{ width: `${Math.min(100, fc.impact_points * 2.5)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live IoT Sensor Telemetry */}
      {ward.live_sensor_telemetry && (
        <div className="border border-slate-200/80 bg-slate-50 rounded-2xl p-3.5">
          <div className="flex items-center justify-between mb-2 text-xs text-slate-800">
            <span className="flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-[#064244]" />
              <span className="font-bold">{ward.live_sensor_telemetry.node_id}</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white text-slate-600 border border-slate-200 font-medium">
              868.1 MHz LoRa
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
              <span className="text-[10px] text-slate-500 font-medium block">RIVER STAGE (SONAR)</span>
              <div className="text-base font-bold text-slate-900 mt-0.5">
                {ward.live_sensor_telemetry.water_level_cm.toFixed(1)} cm
              </div>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
              <span className="text-[10px] text-slate-500 font-medium block">SLOPE TILT ANGLE</span>
              <div className="text-base font-bold text-amber-700 mt-0.5">
                {ward.live_sensor_telemetry.tilt_angle_deg?.toFixed(1) || '1.1'}°
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Physical Hydrological Threshold (Intensity-Duration Curve) */}
      <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 text-[11px] space-y-2">
        <div className="flex items-center justify-between text-slate-500">
          <span className="text-[11px] text-slate-800 font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#064244]" />
            GSI / CWC Physical I-D Curve
          </span>
          <span className="text-[10px] text-slate-500 font-mono">I = 14.82 &middot; D<sup>-0.39</sup></span>
        </div>

        {/* Mini SVG Physical Threshold Curve Visualization */}
        <div className="relative h-14 w-full bg-white rounded-xl border border-slate-200/80 overflow-hidden px-2 pt-1">
          <svg className="w-full h-full" viewBox="0 0 200 48" preserveAspectRatio="none">
            <defs>
              <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.05" />
              </linearGradient>
            </defs>
            {/* Safe zone fill */}
            <path d="M 0,48 L 0,8 Q 50,18 100,24 T 200,32 L 200,48 Z" fill="url(#curveGradient)" />
            {/* GSI Physical Threshold Curve */}
            <path d="M 0,8 Q 50,18 100,24 T 200,32" fill="none" stroke="#ea580c" strokeWidth="2" strokeDasharray="3,2" />
            {/* Operating Point: 24h storm rate */}
            <circle
              cx="130"
              cy={Math.max(6, Math.min(42, 40 - ((ward.rainfall_current_24h / 24) / 8.0) * 35))}
              r="4"
              fill={isBreached ? '#ef4444' : '#10b981'}
              stroke="#ffffff"
              strokeWidth="1.5"
            />
            <circle
              cx="130"
              cy={Math.max(6, Math.min(42, 40 - ((ward.rainfall_current_24h / 24) / 8.0) * 35))}
              r="3"
              fill={isBreached ? '#ef4444' : '#10b981'}
            />
          </svg>
          <div className="absolute top-1 right-2 text-[9px] font-mono text-slate-400">
            Storm Operating Point (24h)
          </div>
        </div>

        <div className="flex items-center justify-between pt-0.5">
          <div className="text-slate-600">
            Current Rate: <strong className="text-slate-900 font-bold">{(ward.rainfall_current_24h / 24).toFixed(2)} mm/h</strong>
            <span className="text-slate-400 text-[10px] ml-1">(Limit: 4.29)</span>
          </div>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
              isBreached
                ? 'bg-red-50 text-red-700 border-red-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}
          >
            {isBreached ? 'PHYSICAL BREACH' : 'STABLE SLOPE'}
          </span>
        </div>
      </div>

      {/* Operational Actions */}
      <div className="pt-1 space-y-2 font-sans">
        <button
          onClick={() => {
            const text = i18n.language === 'hi'
              ? `वार्ड ${ward.ward_name} के लिए स्थिति रिपोर्ट। वर्तमान जोखिम स्कोर ${ward.risk_score.toFixed(0)} है। 24 घंटे की वर्षा ${ward.rainfall_current_24h.toFixed(0)} मिलीमीटर है। अनुमानित लीड टाइम ${ward.lead_time_hours.toFixed(1)} घंटे।`
              : `Situation briefing for ${ward.ward_name}. Current composite risk index is ${ward.risk_score.toFixed(0)} out of 100. Current 24 hour rainfall is ${ward.rainfall_current_24h.toFixed(0)} millimeters. Actionable lead time is ${ward.lead_time_hours.toFixed(1)} hours.`;
            alertBroadcaster.speakDirective(text, i18n.language as 'en' | 'hi');
          }}
          className="w-full py-2.5 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200/90 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center justify-center space-x-2 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#064244] min-h-[40px]"
          aria-label="Broadcast tactical voice briefing for this ward"
        >
          <Volume2 className="w-4 h-4 text-[#064244]" aria-hidden="true" />
          <span>Broadcast Tactical Voice Briefing</span>
        </button>

        <button
          onClick={handleDispatch}
          disabled={isSending}
          className="w-full py-2.5 px-3.5 rounded-xl bg-[#ea580c] hover:bg-[#c2410c] active:bg-[#9a3412] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ea580c] min-h-[42px]"
          aria-label="Dispatch Emergency Warning Directive"
        >
          <Send className="w-4 h-4" aria-hidden="true" />
          <span>{isSending ? 'Dispatching...' : 'Dispatch Emergency Directive'}</span>
        </button>

        <button
          onClick={handleSimulateSurgeClick}
          className="w-full py-2 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200/90 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#064244] min-h-[36px]"
          aria-label="Simulate IoT ultrasonic surge spike for this ward"
        >
          <span>{surgeSimulated ? 'Surge Injected (+85cm)' : 'Simulate IoT Surge Spike'}</span>
        </button>

        <div aria-live="polite">
          {alertSent && (
            <div className="flex items-center space-x-2 bg-emerald-50 border border-emerald-200 text-emerald-800 p-2.5 rounded-xl text-xs font-medium animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" aria-hidden="true" />
              <span>Directive Dispatched to NDRF and District EOC</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
