import React, { useEffect, useState } from 'react';
import {
  X,
  History,
  Send,
  CheckCircle2,
  Clock,
  Phone,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { AlertDispatchRecord } from '../types';

interface AlertsAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AlertsAuditModal: React.FC<AlertsAuditModalProps> = ({
  isOpen,
  onClose
}) => {
  const [dispatches, setDispatches] = useState<AlertDispatchRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/alerts/history');
      if (res.ok) {
        const data = await res.json();
        setDispatches(data);
      }
    } catch (e) {
      console.error('Failed to fetch alerts dispatch history:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="alerts-history-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
    >
      <div className="bg-tactical-surface border border-tactical-border rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-tactical-border flex items-center justify-between bg-tactical-card">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400">
              <History className="w-6 h-6" />
            </div>
            <div>
              <h3 id="alerts-history-title" className="font-display font-bold text-lg text-white">
                Emergency Dispatch Audit Log
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Immutable record of all SMS flash flood warning directives dispatched to NDRF & SDMA units
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={fetchHistory}
              disabled={loading}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all text-xs flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={onClose}
              aria-label="Close Alerts Log Modal"
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Audit Log List */}
        <div className="p-5 overflow-y-auto space-y-3 font-mono text-xs">
          {dispatches.length === 0 ? (
            <div className="p-10 text-center text-slate-500 bg-tactical-card rounded-xl border border-tactical-border">
              <Send className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              <p className="text-slate-400 font-semibold">No Emergency Dispatches Logged in this Session</p>
              <p className="text-xs text-slate-500 mt-1">
                Trigger an alert from the Ward Detail Panel to generate verifiable dispatch records.
              </p>
            </div>
          ) : (
            dispatches.map((record) => (
              <div
                key={record.dispatch_id}
                className="bg-tactical-card border border-tactical-border rounded-xl p-4 hover:border-slate-700 transition-all space-y-2.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-800 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      <span>{record.alert_level}</span>
                    </span>
                    <strong className="text-white text-sm">{record.ward_name}</strong>
                    <span className="text-slate-400">({record.ward_id})</span>
                  </div>

                  <div className="flex items-center space-x-3 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-cyan-400" />
                      <span>{new Date(record.timestamp).toLocaleString()}</span>
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{record.status} ({record.provider})</span>
                    </span>
                  </div>
                </div>

                {/* Directive Message Text */}
                <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 text-slate-200 leading-relaxed text-[11px] whitespace-pre-line">
                  {record.message_body || record.message_preview || 'No message text recorded.'}
                </div>

                {/* Recipients and ID */}
                {(() => {
                  const recList = record.recipients || (record.recipient ? [record.recipient] : []);
                  const count = record.recipients_count || recList.length;
                  return (
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400 pt-1">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-cyan-400" />
                        <span>Recipients ({count}):</span>
                        <span className="text-slate-300">{recList.length > 0 ? recList.join(', ') : 'NDRF / DEOC Standard Group'}</span>
                      </div>
                      <div className="text-slate-500">
                        Dispatch ID: <strong className="text-slate-400 font-mono">{record.dispatch_id}</strong>
                      </div>
                    </div>
                  );
                })()}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
