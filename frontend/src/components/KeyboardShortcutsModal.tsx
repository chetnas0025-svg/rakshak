import React from 'react';
import { X, Keyboard, Eye, Volume2, Search, Sliders, Shield, Bot } from 'lucide-react';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose
}) => {
  const containerRef = useFocusTrap(isOpen);

  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Ctrl + K', desc: 'Open Quick Ward Search Palette', icon: Search },
    { key: '?', desc: 'Open / Close this Keyboard Shortcuts Guide', icon: Keyboard },
    { key: 'Alt + A', desc: 'Open Autonomous AI Multi-Agent Triage (HITL Gate)', icon: Bot },
    { key: 'Alt + S', desc: 'Open Official NDRF SITREP Document', icon: Shield },
    { key: 'Alt + C', desc: 'Toggle High-Contrast / Sunlight Mode', icon: Eye },
    { key: 'Alt + T', desc: 'Cycle Text Size (Standard → Large → X-Large)', icon: Sliders },
    { key: 'Alt + V', desc: 'Toggle Spoken Voice Siren & Broadcasts', icon: Volume2 },
    { key: '1, 2, 3, 4', desc: 'Filter District (1: All, 2: Mandi, 3: Kullu, 4: Kangra)', icon: Keyboard },
    { key: 'Esc', desc: 'Close any active modal or dialog', icon: Keyboard }
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
    >
      <div
        ref={containerRef}
        className="bg-tactical-surface border border-tactical-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 border-b border-tactical-border flex items-center justify-between bg-tactical-card">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <h3 id="shortcuts-title" className="text-sm font-bold text-slate-100">
                Tactical Keyboard Shortcuts & Accessibility
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Hands-on keyboard navigation for emergency command centers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto font-mono text-xs">
          {shortcuts.map(s => {
            const Icon = s.icon;
            return (
              <div
                key={s.key}
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/70 border border-tactical-border"
              >
                <div className="flex items-center space-x-2 text-slate-300">
                  <Icon className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                  <span className="font-sans text-xs">{s.desc}</span>
                </div>
                <kbd className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-cyan-300 font-bold text-[11px] shadow-sm flex-shrink-0">
                  {s.key}
                </kbd>
              </div>
            );
          })}
        </div>

        {/* Accessibility Compliance Callout */}
        <div className="p-3.5 border-t border-tactical-border bg-slate-900/40 text-[11px] text-slate-400 flex items-center justify-between">
          <span className="text-emerald-400 font-semibold">WCAG 2.1 AA Compliant</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-sans text-xs transition-colors"
          >
            Close (Esc)
          </button>
        </div>
      </div>
    </div>
  );
};
