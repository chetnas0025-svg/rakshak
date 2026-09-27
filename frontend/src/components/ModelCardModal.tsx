import React from 'react';
import { useTranslation } from 'react-i18next';
import { X, FileCode, ShieldCheck, BarChart3, AlertOctagon } from 'lucide-react';
import { ModelInfo } from '../types';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  modelInfo: ModelInfo | null;
}

export const ModelCardModal: React.FC<ModalProps> = ({ isOpen, onClose, modelInfo }) => {
  const { t } = useTranslation();

  if (!isOpen || !modelInfo) return null;

  const m = modelInfo.measured_validation_metrics;
  const b = modelInfo.literature_benchmark;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-tactical-surface border border-tactical-border rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-tactical-border flex items-center justify-between bg-tactical-card">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-white">
                Rakshak Model Card (v{modelInfo.model_version})
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Algorithm: {modelInfo.algorithm}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Strict Benchmark Notice */}
          <div className="bg-amber-950/40 border border-amber-800/80 rounded-xl p-4 text-xs font-mono text-amber-200 flex items-start space-x-3">
            <AlertOctagon className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-amber-300">Mandatory Data Integrity & Transparency Standard:</strong>
              <p className="mt-1 leading-relaxed text-amber-200/90">
                {modelInfo.disclaimer}
              </p>
            </div>
          </div>

          {/* Side by side comparison: Literature Precedent vs Measured Metrics */}
          <div>
            <h4 className="font-display font-semibold text-sm text-white mb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>Performance Disclosure: Academic Reference vs. Empirical Validation</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Academic Benchmark Card */}
              <div className="bg-slate-900/70 border border-slate-700/80 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                    Literature Precedent
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    Academic Citation
                  </span>
                </div>
                <p className="text-xs text-slate-400 italic">
                  "{b.study_name}" — {b.citation}
                </p>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 font-mono text-xs">
                  <div className="bg-slate-800/60 p-2 rounded">
                    <span className="text-slate-400 text-[10px]">Reported Accuracy</span>
                    <div className="text-lg font-bold text-slate-200">{(b.reported_accuracy * 100).toFixed(2)}%</div>
                  </div>
                  <div className="bg-slate-800/60 p-2 rounded">
                    <span className="text-slate-400 text-[10px]">Reported ROC-AUC</span>
                    <div className="text-lg font-bold text-slate-200">{b.reported_roc_auc.toFixed(3)}</div>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 font-mono">
                  *Evaluated on regional Yunnan watershed. Referenced purely as feature engineering precedent.
                </p>
              </div>

              {/* Our Measured Metrics Card */}
              <div className="bg-cyan-950/30 border border-cyan-800/80 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider">
                    Rakshak Measured Result
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-900 text-cyan-200 border border-cyan-700 font-bold">
                    Our 2025 Holdout
                  </span>
                </div>
                <p className="text-xs text-cyan-200/90 font-mono">
                  Window: {m.evaluation_window} (20 Wards, {m.test_samples_count} Holdout Days)
                </p>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-cyan-900/60 font-mono text-xs">
                  <div className="bg-slate-900/80 p-2 rounded">
                    <span className="text-slate-400 text-[10px]">Recall (Safety)</span>
                    <div className="text-base font-bold text-emerald-400">{(m.recall * 100).toFixed(1)}%</div>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded">
                    <span className="text-slate-400 text-[10px]">Precision</span>
                    <div className="text-base font-bold text-amber-300">{(m.precision * 100).toFixed(1)}%</div>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded">
                    <span className="text-slate-400 text-[10px]">ROC-AUC</span>
                    <div className="text-base font-bold text-cyan-300">{m.roc_auc.toFixed(3)}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-slate-300 pt-1">
                  <span>True Positives: <strong>{m.true_positives}</strong></span>
                  <span>False Negatives: <strong className="text-emerald-400">{m.false_negatives} (0 missed)</strong></span>
                  <span>F1-Score: <strong>{(m.f1_score * 100).toFixed(1)}%</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Importance Table */}
          <div>
            <h4 className="font-display font-semibold text-sm text-white mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              <span>Feature Importances (8 Factors)</span>
            </h4>

            <div className="space-y-2 font-mono text-xs">
              {Object.entries(modelInfo.feature_importances).map(([feat, score], idx) => (
                <div key={feat} className="flex items-center space-x-3 bg-tactical-card p-2 rounded-lg border border-tactical-border">
                  <span className="w-5 text-slate-500 text-right">{idx + 1}.</span>
                  <span className="w-48 text-slate-200 truncate">{feat}</span>
                  <div className="flex-1 bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-cyan-500 h-full rounded-full"
                      style={{ width: `${Math.min(100, score * 100 * 1.5)}%` }}
                    />
                  </div>
                  <span className="w-16 text-right font-bold text-cyan-300">{(score * 100).toFixed(2)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-tactical-border bg-tactical-card flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-all"
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
};
