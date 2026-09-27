import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Activity,
  FileText,
  Globe,
  Radio,
  Search,
  Volume2,
  VolumeX,
  FileSpreadsheet,
  Send,
  Waves,
  Rss,
  Eye,
  Type,
  HelpCircle,
  Download,
  Menu,
  X,
  Bot
} from 'lucide-react';
import { alertBroadcaster } from '../utils/audioAlert';

interface HeaderProps {
  onOpenModelCard: () => void;
  onOpenValidation: () => void;
  onOpenSitRep: () => void;
  onOpenSearch: () => void;
  onOpenSensors: () => void;
  onOpenAlertsAudit: () => void;
  onOpenRiverCascade: () => void;
  onOpenCAP: () => void;
  onOpenExport: () => void;
  activeSensorsCount: number;
  isHighContrast: boolean;
  onToggleHighContrast: () => void;
  textScale: 'normal' | 'large' | 'xlarge';
  onCycleTextScale: () => void;
  onOpenShortcuts: () => void;
  onOpenAgentTriage: () => void;
  onOpenCitizenReport: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenModelCard,
  onOpenValidation,
  onOpenSitRep,
  onOpenSearch,
  onOpenSensors,
  onOpenAlertsAudit,
  onOpenRiverCascade,
  onOpenCAP,
  onOpenExport,
  activeSensorsCount,
  isHighContrast,
  onToggleHighContrast,
  textScale,
  onCycleTextScale,
  onOpenShortcuts,
  onOpenAgentTriage,
  onOpenCitizenReport
}) => {
  const { t, i18n } = useTranslation();
  const [audioEnabled, setAudioEnabled] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [militaryTime, setMilitaryTime] = React.useState<{ utc: string; ist: string }>({ utc: '--:--:--', ist: '--:--:--' });

  React.useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const utcStr = now.toISOString().substring(11, 19);
      const istStr = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).format(now);
      setMilitaryTime({ utc: utcStr, ist: istStr });
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'en' ? 'hi' : 'en';
    i18n.changeLanguage(nextLang);
  };

  const handleToggleAudio = () => {
    const nextState = !audioEnabled;
    setAudioEnabled(nextState);
    if (nextState) {
      alertBroadcaster.playAlertChime('warning');
      const msg = i18n.language === 'hi'
        ? 'ध्वनि चेतावनी प्रणाली सक्रिय है।'
        : 'Audio emergency alert broadcaster enabled.';
      alertBroadcaster.speakDirective(msg, i18n.language as 'en' | 'hi');
    }
  };

  const handleMobileAction = (action: () => void) => {
    action();
    setIsMobileMenuOpen(false);
  };

  return (
    <header
      role="banner"
      className="border-b border-[#032e30] bg-[#064244] text-white sticky top-0 z-50 px-4 md:px-6 py-2.5 shadow-md transition-colors"
    >
      <div className="max-w-7xl w-full mx-auto flex items-center justify-between gap-2 md:gap-3">
        {/* Brand & Emblem */}
        <div className="flex items-center space-x-2.5 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-[#ea580c] flex items-center justify-center text-white font-display font-black text-base shadow-sm flex-shrink-0">
            R
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-display font-bold text-base tracking-tight text-white flex items-center gap-2">
                {t('app_title')}
                <span className="hidden sm:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#0a5254] text-teal-200 border border-[#0e5c5f] font-bold">
                  HP FIELD OPS
                </span>
              </h1>
            </div>
            <p className="text-[11px] text-teal-200/80 truncate max-w-[160px] sm:max-w-xs md:max-w-sm font-sans">
              {t('app_subtitle')}
            </p>
          </div>
        </div>

        {/* Center Navigation Links (Command Center Nav Bar) */}
        <nav className="hidden lg:flex items-center space-x-1 font-sans text-xs font-medium flex-wrap" aria-label="Command Center Navigation">
          <button
            onClick={onOpenAgentTriage}
            className="flex items-center space-x-1.5 bg-[#0a5254] hover:bg-[#0d6063] text-white px-3 py-1.5 rounded-lg border border-[#0f6e72] transition-colors shadow-sm cursor-pointer"
            title="Open Autonomous Multi-Agent Triage Pipeline"
          >
            <Bot className="w-3.5 h-3.5 text-teal-200" aria-hidden="true" />
            <span>AI Triage</span>
          </button>

          <button
            onClick={onOpenSensors}
            className="flex items-center space-x-1.5 hover:bg-[#08484a] text-teal-100 hover:text-white px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            title="Inspect Ultrasonic River Gauges"
          >
            <Radio className="w-3.5 h-3.5 text-teal-300" aria-hidden="true" />
            <span>{activeSensorsCount} IoT Sensors</span>
          </button>

          <button
            onClick={onOpenRiverCascade}
            className="flex items-center space-x-1.5 hover:bg-[#08484a] text-teal-100 hover:text-white px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            title="River Cascade Routing"
          >
            <Waves className="w-3.5 h-3.5 text-teal-300" aria-hidden="true" />
            <span>Cascades</span>
          </button>

          <button
            onClick={onOpenCAP}
            className="flex items-center space-x-1.5 hover:bg-[#08484a] text-teal-100 hover:text-white px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            title="Open NDMA CAP-India Feed"
          >
            <Rss className="w-3.5 h-3.5 text-amber-300" aria-hidden="true" />
            <span>CAP Feed</span>
          </button>

          <button
            onClick={onOpenSitRep}
            className="flex items-center space-x-1.5 hover:bg-[#08484a] text-teal-100 hover:text-white px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            title="Official Situation Report"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-teal-300" aria-hidden="true" />
            <span>SITREP</span>
          </button>

          <button
            onClick={onOpenExport}
            className="flex items-center space-x-1.5 hover:bg-[#08484a] text-teal-100 hover:text-white px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            title="Export Spatial & Tabular Data"
          >
            <Download className="w-3.5 h-3.5 text-teal-300" aria-hidden="true" />
            <span>Export</span>
          </button>
        </nav>

        {/* Right Action Clusters */}
        <div className="hidden lg:flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {/* Commusoft Style Search Pill */}
          <button
            onClick={onOpenSearch}
            className="flex items-center space-x-1.5 bg-[#043335] hover:bg-[#032e30] border border-[#0a5254] px-2.5 py-1.5 rounded-lg text-xs font-sans text-teal-100 transition-colors cursor-pointer"
            title="Search Wards & Basins (Ctrl+K)"
          >
            <Search className="w-3.5 h-3.5 text-teal-300" aria-hidden="true" />
            <span className="hidden xl:inline">Search...</span>
            <kbd className="text-[9px] px-1 py-0.5 rounded bg-[#064244] border border-[#0a5254] text-teal-300 font-mono">Ctrl+K</kbd>
          </button>

          {/* Citizen Hazard Report Button */}
          <button
            onClick={onOpenCitizenReport}
            className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md transition-all cursor-pointer flex items-center space-x-1.5 animate-pulse flex-shrink-0"
            title="Report Ground Hazard (Tension Crack, Seepage, Rockfall)"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="whitespace-nowrap">Report Hazard</span>
          </button>

          {/* Mission Time Clock */}
          <div className="hidden sm:flex items-center gap-1.5 bg-[#043335] border border-[#0a5254] px-2 py-1.5 rounded-lg font-mono text-[11px] text-teal-200">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white font-bold">{militaryTime.ist}</span>
            <span className="text-teal-400 text-[10px]">IST</span>
          </div>

          {/* Voice Alert Toggle */}
          <button
            onClick={handleToggleAudio}
            className={`px-2 py-1.5 rounded-lg text-xs font-sans border transition-colors cursor-pointer flex items-center space-x-1 ${
              audioEnabled
                ? 'bg-amber-500 border-amber-400 text-slate-950 font-bold shadow-sm'
                : 'bg-[#043335] hover:bg-[#032e30] border-[#0a5254] text-teal-100'
            }`}
            title={audioEnabled ? "Audio Active (Alt+V)" : "Enable Audio Voice (Alt+V)"}
          >
            {audioEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 text-teal-300" />}
            <span className="hidden xl:inline">{audioEnabled ? 'Voice ON' : 'Mute'}</span>
          </button>

          {/* High Contrast Mode Toggle */}
          <button
            onClick={onToggleHighContrast}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              isHighContrast
                ? 'bg-white text-black font-bold border-white'
                : 'bg-[#043335] hover:bg-[#032e30] text-teal-200 border-[#0a5254]'
            }`}
            title="Toggle High Contrast Mode (Alt+C)"
            aria-label="Toggle High Contrast Mode"
          >
            <Eye className="w-4 h-4" />
          </button>

          {/* Language Switcher */}
          <button
            onClick={toggleLanguage}
            className="px-2 py-1.5 rounded-lg text-xs font-mono bg-[#043335] hover:bg-[#032e30] text-teal-100 border border-[#0a5254] transition-colors cursor-pointer flex items-center space-x-1"
            title="Toggle English / हिन्दी"
          >
            <Globe className="w-3.5 h-3.5 text-teal-300" />
            <span>{i18n.language === 'en' ? 'हिन्दी' : 'EN'}</span>
          </button>

          {/* User Avatar Circle */}
          <div
            className="w-7 h-7 rounded-full bg-[#f59e0b] text-[#78350f] font-bold text-xs flex items-center justify-center shadow-sm cursor-default"
            title="Himachal Pradesh SDMA Command Post"
          >
            HP
          </div>
        </div>


        {/* Mobile Action Controls (< lg screens) */}
        <div className="flex lg:hidden items-center space-x-1.5">
          <button
            onClick={onOpenSearch}
            className="p-2 rounded bg-[#212934] border border-[#2d3744] text-[#0284c7] min-h-[40px] min-w-[40px] flex items-center justify-center transition-colors focus-visible:outline-2 focus-visible:outline-[#0284c7]"
            aria-label="Quick Search Wards (Ctrl+K)"
          >
            <Search className="w-4 h-4" aria-hidden="true" />
          </button>

          <button
            onClick={handleToggleAudio}
            className={`p-2 rounded border min-h-[40px] min-w-[40px] flex items-center justify-center transition-colors focus-visible:outline-2 focus-visible:outline-[#0284c7] ${
              audioEnabled
                ? 'bg-[#b45309] border-[#b45309] text-white'
                : 'bg-[#212934] border-[#2d3744] text-slate-400'
            }`}
            aria-label={audioEnabled ? "Disable Audio Siren" : "Enable Audio Siren"}
            aria-pressed={audioEnabled}
          >
            {audioEnabled ? <Volume2 className="w-4 h-4 text-white" aria-hidden="true" /> : <VolumeX className="w-4 h-4" aria-hidden="true" />}
          </button>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded bg-[#212934] hover:bg-[#2d3744] border border-[#2d3744] text-[#e6edf3] min-h-[40px] text-xs font-mono font-bold transition-colors focus-visible:outline-2 focus-visible:outline-[#0284c7]"
            aria-expanded={isMobileMenuOpen}
            aria-label="Toggle Operations and Features Menu"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4 text-[#dc2626]" aria-hidden="true" /> : <Menu className="w-4 h-4 text-slate-300" aria-hidden="true" />}
            <span className="text-xs uppercase">{isMobileMenuOpen ? 'Close' : 'Ops'}</span>
          </button>
        </div>
      </div>

      {/* Mobile Operations Dropdown Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden mt-2 pt-2 border-t border-[#2d3744] space-y-2.5 animate-fadeIn">
          {/* Section 1: Hydrology & Real-time Streams */}
          <div>
            <p className="text-[10px] font-mono uppercase text-slate-400 mb-1 px-1">
              Live Hydrology & Streams
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => handleMobileAction(onOpenSensors)}
                className="flex items-center space-x-2 p-2 rounded bg-[#212934] border border-[#2d3744] text-[#0284c7] text-xs font-mono min-h-[40px] active:bg-[#2d3744]"
              >
                <Radio className="w-4 h-4 text-[#0284c7] flex-shrink-0" />
                <span className="truncate">{activeSensorsCount} IoT Nodes</span>
              </button>

              <button
                onClick={() => handleMobileAction(onOpenRiverCascade)}
                className="flex items-center space-x-2 p-2 rounded bg-[#212934] border border-[#2d3744] text-slate-200 text-xs font-mono min-h-[40px] active:bg-[#2d3744]"
              >
                <Waves className="w-4 h-4 text-[#0284c7] flex-shrink-0" />
                <span className="truncate">River Cascades</span>
              </button>

              <button
                onClick={() => handleMobileAction(onOpenCAP)}
                className="flex items-center space-x-2 p-2 rounded bg-[#212934] border border-[#2d3744] text-[#b45309] text-xs font-mono min-h-[40px] active:bg-[#2d3744] col-span-2"
              >
                <Rss className="w-4 h-4 text-[#b45309] flex-shrink-0" />
                <span>NDMA CAP-India Alert Feed</span>
              </button>
            </div>
          </div>

          {/* Section 2: Command Operations & Reporting */}
          <div>
            <p className="text-[10px] font-mono uppercase text-slate-400 mb-1 px-1">
              Operations & Reporting
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => handleMobileAction(onOpenSitRep)}
                className="flex items-center space-x-2 p-2 rounded bg-[#212934] border border-[#2d3744] text-slate-200 text-xs font-mono min-h-[40px] active:bg-[#2d3744]"
              >
                <FileSpreadsheet className="w-4 h-4 text-slate-300 flex-shrink-0" />
                <span>NDRF SITREP</span>
              </button>

              <button
                onClick={() => handleMobileAction(onOpenExport)}
                className="flex items-center space-x-2 p-2 rounded bg-[#212934] border border-[#2d3744] text-slate-200 text-xs font-mono min-h-[40px] active:bg-[#2d3744]"
              >
                <Download className="w-4 h-4 text-slate-300 flex-shrink-0" />
                <span>Open Data Export</span>
              </button>

              <button
                onClick={() => handleMobileAction(onOpenAlertsAudit)}
                className="flex items-center space-x-2 p-2 rounded bg-[#212934] border border-[#2d3744] text-slate-200 text-xs font-mono min-h-[40px] active:bg-[#2d3744]"
              >
                <Send className="w-4 h-4 text-[#dc2626] flex-shrink-0" />
                <span>Alert Audit Log</span>
              </button>

              <button
                onClick={() => handleMobileAction(onOpenAgentTriage)}
                className="flex items-center space-x-2 p-2 rounded bg-[#212934] border border-[#0284c7]/50 text-[#0284c7] text-xs font-mono min-h-[40px] active:bg-[#2d3744] col-span-2"
              >
                <Bot className="w-4 h-4 text-[#0284c7] flex-shrink-0" />
                <span>Autonomous AI Agent Triage (HITL)</span>
              </button>

              <button
                onClick={() => handleMobileAction(onOpenValidation)}
                className="flex items-center space-x-2 p-2 rounded bg-[#212934] border border-[#2d3744] text-[#b45309] text-xs font-mono min-h-[40px] active:bg-[#2d3744]"
              >
                <Activity className="w-4 h-4 text-[#b45309] flex-shrink-0" />
                <span>2025 Holdout</span>
              </button>

              <button
                onClick={() => handleMobileAction(onOpenModelCard)}
                className="flex items-center space-x-2 p-2 rounded bg-[#212934] border border-[#2d3744] text-slate-200 text-xs font-mono min-h-[40px] active:bg-[#2d3744] col-span-2"
              >
                <FileText className="w-4 h-4 text-slate-300 flex-shrink-0" />
                <span>AI/ML Physics Model Card</span>
              </button>
            </div>
          </div>

          {/* Section 3: Accessibility & Preferences */}
          <div>
            <p className="text-[10px] font-mono uppercase text-slate-400 mb-1 px-1">
              Accessibility & Settings
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={onToggleHighContrast}
                className={`flex items-center space-x-2 p-2 rounded border text-xs font-mono min-h-[40px] transition-colors ${
                  isHighContrast
                    ? 'bg-white text-black font-bold border-white'
                    : 'bg-[#212934] border-[#2d3744] text-slate-300'
                }`}
              >
                <Eye className="w-4 h-4 flex-shrink-0" />
                <span>Contrast: {isHighContrast ? 'ON' : 'OFF'}</span>
              </button>

              <button
                onClick={onCycleTextScale}
                className="flex items-center space-x-2 p-2 rounded bg-[#212934] border border-[#2d3744] text-slate-300 text-xs font-mono min-h-[40px]"
              >
                <Type className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span>Size: {textScale === 'normal' ? '100%' : textScale === 'large' ? '115%' : '130%'}</span>
              </button>

              <button
                onClick={toggleLanguage}
                className="flex items-center space-x-2 p-2 rounded bg-[#212934] border border-[#2d3744] text-slate-300 text-xs font-mono min-h-[40px]"
              >
                <Globe className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span>Lang: {i18n.language === 'en' ? 'हिन्दी' : 'EN'}</span>
              </button>

              <button
                onClick={() => handleMobileAction(onOpenShortcuts)}
                className="flex items-center space-x-2 p-2 rounded bg-[#212934] border border-[#2d3744] text-slate-300 text-xs font-mono min-h-[40px]"
              >
                <HelpCircle className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span>Key Shortcuts</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
