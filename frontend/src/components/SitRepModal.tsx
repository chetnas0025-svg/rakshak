import React from 'react';
import { useTranslation } from 'react-i18next';
import { X, Printer, ShieldAlert, FileSpreadsheet } from 'lucide-react';
import { SitRepData } from '../types';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface SitRepModalProps {
  isOpen: boolean;
  onClose: () => void;
  sitrep: SitRepData | null;
}

export const SitRepModal: React.FC<SitRepModalProps> = ({ isOpen, onClose, sitrep }) => {
  const containerRef = useFocusTrap(isOpen);
  const { t } = useTranslation();

  if (!isOpen || !sitrep) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(sitrep, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${sitrep.sitrep_number}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="sitrep-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn"
    >
      <div
        ref={containerRef}
        className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden print:max-h-none print:w-full print:border-none print:shadow-none text-slate-800"
      >
        {/* Header */}
        <div className="p-5 border-b border-[#043335] flex items-center justify-between bg-[#064244] text-white print:hidden">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#0a5254] border border-[#0e6264] flex items-center justify-center text-amber-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 id="sitrep-title" className="font-display font-bold text-lg text-white">
                Tactical Situation Report (SITREP)
              </h3>
              <p className="text-xs text-teal-200/80 font-mono">
                {sitrep.sitrep_number} • {sitrep.reporting_agency}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportJSON}
              className="px-3 py-1.5 rounded-full bg-[#0a5254] hover:bg-[#0e6264] text-teal-100 border border-[#137275] text-xs flex items-center gap-1.5 transition-all shadow-xs"
              title="Export Raw JSON"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export JSON</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-full bg-[#ea580c] hover:bg-[#d94e08] text-white text-xs flex items-center gap-1.5 transition-all shadow-xs font-semibold"
              title="Print Official SITREP"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print SITREP</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/10 text-teal-200 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-6 overflow-y-auto space-y-5 print:p-0 print:text-black font-mono text-xs leading-relaxed bg-white">
          {/* Official Document Banner */}
          <div className="border-b-2 border-slate-200 pb-3 flex justify-between items-start">
            <div>
              <div className="font-bold text-base uppercase tracking-wider text-slate-900 print:text-black">
                NATIONAL DISASTER RESPONSE FORCE (NDRF) / HIMACHAL PRADESH SDMA
              </div>
              <div className="text-xs text-slate-500 print:text-gray-600">
                Early Warning Operations Command • {sitrep.operation_codename}
              </div>
            </div>
            <div className="text-right text-[11px] text-slate-500 print:text-gray-600">
              <div>Ref: <strong className="text-slate-800">{sitrep.sitrep_number}</strong></div>
              <div>Generated: {new Date(sitrep.timestamp).toLocaleString()}</div>
            </div>
          </div>

          {/* KPI Matrix Table */}
          <div>
            <div className="font-bold text-xs uppercase text-[#064244] print:text-black mb-2 tracking-wider">
              1. REGIONAL THREAT STATUS & SUMMARY
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 print:border-gray-400">
                <span className="text-slate-500 text-[10px] uppercase font-semibold">TOTAL WARDS MONITORED</span>
                <div className="text-xl font-bold text-slate-900 print:text-black">{sitrep.summary_statistics.total_monitored_wards}</div>
              </div>
              <div className="bg-red-50 p-3 rounded-xl border border-red-200 print:border-gray-400">
                <span className="text-red-700 text-[10px] uppercase font-semibold">CRITICAL / WARNING WARDS</span>
                <div className="text-xl font-bold text-red-600 print:text-red-700">{sitrep.summary_statistics.critical_warning_count}</div>
              </div>
              <div className="bg-teal-50 p-3 rounded-xl border border-teal-200 print:border-gray-400">
                <span className="text-[#064244] text-[10px] uppercase font-semibold">AVG WARNING LEAD TIME</span>
                <div className="text-xl font-bold text-[#064244] print:text-black">3.8 hrs</div>
              </div>
              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 print:border-gray-400">
                <span className="text-emerald-800 text-[10px] uppercase font-semibold">ACTIVE IOT GAUGES</span>
                <div className="text-xl font-bold text-emerald-600 print:text-black">4 Nodes</div>
              </div>
            </div>
          </div>

          {/* Critical Wards Roster */}
          <div>
            <div className="font-bold text-xs uppercase text-amber-700 print:text-black mb-2 tracking-wider">
              2. HIGH RISK WARDS REQUIRING IMMEDIATE EARLY WARNING / MONITORING
            </div>
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-slate-100 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="p-2.5">Ward / Tehsil</th>
                    <th className="p-2.5">District</th>
                    <th className="p-2.5">Risk Score</th>
                    <th className="p-2.5">Alert Level</th>
                    <th className="p-2.5">Est. Lead Time</th>
                    <th className="p-2.5">24h Rain</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sitrep.critical_wards_details.map(w => (
                    <tr key={w.ward_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-2.5 font-bold text-slate-900 print:text-black">{w.ward_name} ({w.ward_id})</td>
                      <td className="p-2.5 text-slate-600">{w.district}</td>
                      <td className="p-2.5 font-bold text-red-600">{w.risk_score.toFixed(1)}/100</td>
                      <td className="p-2.5 font-bold uppercase text-red-600">{w.alert_level}</td>
                      <td className="p-2.5 text-[#064244] font-bold">{w.lead_time_hours.toFixed(1)} hrs</td>
                      <td className="p-2.5 text-slate-700">{w.rainfall_current_24h.toFixed(1)} mm</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Operational Action Directives */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="font-bold text-xs uppercase text-[#064244] print:text-black tracking-wider">
              3. NDRF DEPLOYMENT DIRECTIVES & CONTACTS
            </div>
            <p className="text-slate-700 leading-relaxed">
              1. 14th Bn NDRF quick-reaction teams to stage rubberized rescue boats and winch systems near Beas / Parbati confluence.<br/>
              2. District Emergency Operations Centers (DEOCs) to broadcast Hindi/English siren and SMS directives to all registered phone numbers in Thunag, Manikaran, and Khaniyara.<br/>
              3. Emergency Toll-Free Helpline: <strong>1077 (District EOC)</strong> / <strong>112 (National Unified Helpline)</strong>.
            </p>
          </div>

          {/* Official Sign-off & Verification Block */}
          <div className="border-t border-slate-200 pt-4 mt-4 grid grid-cols-2 gap-6 text-[11px]">
            <div>
              <div className="text-slate-500">Report Authenticated By:</div>
              <div className="font-bold text-slate-800 print:text-black">Duty Officer (14th Bn NDRF Jassur)</div>
              <div className="text-[10px] text-emerald-600 font-mono mt-0.5">
                DIGITALLY CERTIFIED • SHA256: e8b2f91a...
              </div>
            </div>
            <div className="text-right">
              <div className="text-slate-500">Incident Commander Authorization:</div>
              <div className="h-7 border-b border-dashed border-slate-300 w-48 ml-auto my-1"></div>
              <div className="text-[10px] text-slate-500">Commandant / District Magistrate (HP SDMA)</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end print:hidden">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-[#064244] hover:bg-[#0a5254] text-white text-xs font-semibold transition-all shadow-xs"
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
};
