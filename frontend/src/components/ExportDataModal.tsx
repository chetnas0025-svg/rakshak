import React, { useState } from 'react';
import { X, Download, FileSpreadsheet, Map, Rss, Copy, Check, ShieldCheck } from 'lucide-react';
import { WardRisk } from '../types';
import { exportWardsCSV, exportWardsGeoJSON, exportCapAlertXML } from '../utils/exportUtils';

interface ExportDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  wards: WardRisk[];
  geoJsonData: any;
}

export const ExportDataModal: React.FC<ExportDataModalProps> = ({
  isOpen,
  onClose,
  wards,
  geoJsonData
}) => {
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, endpointKey: string) => {
    navigator.clipboard.writeText(window.location.origin + text);
    setCopiedEndpoint(endpointKey);
    setTimeout(() => setCopiedEndpoint(null), 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
    >
      <div className="bg-tactical-surface border border-tactical-border rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-tactical-border flex items-center justify-between bg-tactical-card">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 id="export-modal-title" className="text-sm font-bold text-slate-100 flex items-center gap-2">
                Export Early Warning Intelligence
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  GIS / EOC Open Data
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Interoperable formats for NDRF, SDMA, QGIS, ArcGIS, and SACHET ingest
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close Export Modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto font-sans text-xs">
          {/* Export Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* 1. CSV Option */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-tactical-border flex flex-col justify-between hover:border-cyan-500/50 transition-all">
              <div>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-2.5">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-slate-200 text-sm">Tabular CSV</h4>
                <p className="text-slate-400 text-[11px] mt-1 leading-snug">
                  All 20 monitored wards with risk scores, 24h/72h rainfall, slope, and lead times.
                </p>
              </div>
              <button
                onClick={() => exportWardsCSV(wards)}
                className="mt-4 w-full py-2 px-3 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 font-medium text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .CSV</span>
              </button>
            </div>

            {/* 2. GeoJSON Option */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-tactical-border flex flex-col justify-between hover:border-cyan-500/50 transition-all">
              <div>
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mb-2.5">
                  <Map className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-slate-200 text-sm">Spatial GeoJSON</h4>
                <p className="text-slate-400 text-[11px] mt-1 leading-snug">
                  Standard FeatureCollection with full polygon geometries and live risk properties for QGIS/ArcGIS.
                </p>
              </div>
              <button
                onClick={() => exportWardsGeoJSON(geoJsonData, wards)}
                className="mt-4 w-full py-2 px-3 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 font-medium text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .GeoJSON</span>
              </button>
            </div>

            {/* 3. NDMA CAP XML */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-tactical-border flex flex-col justify-between hover:border-amber-500/50 transition-all">
              <div>
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-2.5">
                  <Rss className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-slate-200 text-sm">NDMA CAP XML</h4>
                <p className="text-slate-400 text-[11px] mt-1 leading-snug">
                  OASIS Common Alerting Protocol v1.2 XML compliant with national SACHET emergency alert standards.
                </p>
              </div>
              <button
                onClick={exportCapAlertXML}
                className="mt-4 w-full py-2 px-3 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 font-medium text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .XML</span>
              </button>
            </div>
          </div>

          {/* Live REST API Integration Endpoints */}
          <div className="p-4 rounded-xl bg-slate-950 border border-tactical-border space-y-3 font-mono">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                Direct API Endpoints for Automation & CI/CD
              </span>
              <span className="text-[10px] text-slate-500">CORS Enabled • Open Access</span>
            </div>

            <div className="space-y-2 text-[11px]">
              {[
                { name: 'All Wards Risk Feed', path: '/api/v1/risk/all', method: 'GET' },
                { name: 'NDMA CAP OASIS XML', path: '/api/v1/alerts/cap.xml', method: 'GET' },
                { name: 'Hydrological River Networks', path: '/api/v1/catchment/networks', method: 'GET' }
              ].map(ep => (
                <div key={ep.path} className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800">
                  <div className="flex items-center space-x-2">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                      {ep.method}
                    </span>
                    <span className="text-slate-300 font-sans">{ep.name}:</span>
                    <span className="text-cyan-400">{ep.path}</span>
                  </div>
                  <button
                    onClick={() => handleCopy(ep.path, ep.path)}
                    className="p-1 px-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1 text-[10px] transition-colors"
                    title="Copy full URL"
                  >
                    {copiedEndpoint === ep.path ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400 font-sans">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span className="font-sans">Copy</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-tactical-border bg-slate-900/40 text-[11px] text-slate-400 flex items-center justify-between">
          <span className="text-slate-500">Zero Auth Barrier for Field Operations • UTF-8 Standard</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-sans text-xs transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
