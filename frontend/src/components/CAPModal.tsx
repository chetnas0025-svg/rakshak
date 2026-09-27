import React, { useEffect, useState } from 'react';
import {
  X,
  Copy,
  Check,
  Download,
  ExternalLink,
  ShieldCheck,
  Radio,
  Layers
} from 'lucide-react';

interface CAPModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CAPModal: React.FC<CAPModalProps> = ({ isOpen, onClose }) => {
  const [activeFormat, setActiveFormat] = useState<'xml' | 'json'>('xml');
  const [capXml, setCapXml] = useState<string>('');
  const [capJson, setCapJson] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;
    const fetchCap = async () => {
      setLoading(true);
      try {
        const [resXml, resJson] = await Promise.all([
          fetch('/api/v1/alerts/cap.xml'),
          fetch('/api/v1/alerts/cap.json')
        ]);
        if (resXml.ok) {
          const xml = await resXml.text();
          setCapXml(xml);
        }
        if (resJson.ok) {
          const json = await resJson.json();
          setCapJson(JSON.stringify(json, null, 2));
        }
      } catch (err) {
        console.error('Failed to load CAP feeds:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCap();
  }, [isOpen]);

  const handleCopy = () => {
    const textToCopy = activeFormat === 'xml' ? capXml : capJson;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const content = activeFormat === 'xml' ? capXml : capJson;
    const mime = activeFormat === 'xml' ? 'application/xml' : 'application/json';
    const ext = activeFormat === 'xml' ? 'xml' : 'json';
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CAP-India-Alert-${new Date().toISOString().slice(0, 10)}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
    >
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-800">
        {/* Header */}
        <div className="p-5 border-b border-[#043335] flex items-center justify-between bg-[#064244] text-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#0a5254] border border-[#0e6264] flex items-center justify-center text-amber-400">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <span>NDMA CAP-India Emergency Alert Feed</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1 font-semibold">
                  <ShieldCheck className="w-3 h-3" />
                  <span>OASIS CAP v1.2 COMPLIANT</span>
                </span>
              </h3>
              <p className="text-xs text-teal-200/80">
                Standardized machine-readable broadcast format for SACHET portal & State Emergency Operation Centres
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

        {/* Controls Bar */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Format Tabs */}
          <div className="flex rounded-full bg-slate-200/80 p-1 border border-slate-300">
            <button
              onClick={() => setActiveFormat('xml')}
              className={`px-3.5 py-1 rounded-full font-mono text-xs font-semibold transition-all ${
                activeFormat === 'xml'
                  ? 'bg-[#064244] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              XML (Standard OASIS)
            </button>
            <button
              onClick={() => setActiveFormat('json')}
              className={`px-3.5 py-1 rounded-full font-mono text-xs font-semibold transition-all ${
                activeFormat === 'json'
                  ? 'bg-[#064244] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              JSON (REST API)
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="px-3.5 py-1.5 rounded-full bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 flex items-center space-x-1.5 font-medium transition-colors shadow-xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copied ? 'Copied Payload!' : 'Copy to Clipboard'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="px-3.5 py-1.5 rounded-full bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 flex items-center space-x-1.5 font-medium transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Download .{activeFormat}</span>
            </button>

            <a
              href={`/api/v1/alerts/cap.${activeFormat}`}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-1.5 rounded-full bg-orange-50 hover:bg-orange-100 text-[#ea580c] border border-orange-200 flex items-center space-x-1.5 font-semibold transition-colors shadow-xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open Endpoint</span>
            </a>
          </div>
        </div>

        {/* Content Viewer */}
        <div className="p-4 overflow-y-auto flex-1 bg-white">
          <div className="p-4 rounded-xl bg-slate-900 font-mono text-xs text-slate-300 shadow-inner h-full min-h-[300px] overflow-auto">
            {loading ? (
              <div className="py-12 text-center text-slate-400">Loading standardized alert payload...</div>
            ) : (
              <pre className="whitespace-pre-wrap leading-relaxed text-[11px] text-emerald-300 font-mono">
                {activeFormat === 'xml' ? capXml : capJson}
              </pre>
            )}
          </div>
        </div>

        {/* Interoperability Info Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-[#ea580c]" />
            <span>Integrates with: NDMA SACHET, Himachal SEOC, CWC Flood Forecasting Network</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-[#064244] hover:bg-[#0a5254] text-white font-semibold transition-colors shadow-xs"
          >
            Close Feed
          </button>
        </div>
      </div>
    </div>
  );
};
