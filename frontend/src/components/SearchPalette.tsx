import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ArrowRight } from 'lucide-react';
import { WardRisk } from '../types';

interface SearchPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  wards: WardRisk[];
  onSelectWard: (wardId: string) => void;
}

export const SearchPalette: React.FC<SearchPaletteProps> = ({
  isOpen,
  onClose,
  wards,
  onSelectWard
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Global shortcut to open with Ctrl+K or /
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filtered = query.trim() === ''
    ? wards.slice(0, 8)
    : wards.filter(w =>
        w.ward_name.toLowerCase().includes(query.toLowerCase()) ||
        w.district_name.toLowerCase().includes(query.toLowerCase()) ||
        w.ward_id.toLowerCase().includes(query.toLowerCase())
      );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Quick Ward Search Palette"
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-200 flex items-center space-x-3 bg-slate-50">
          <Search className="w-5 h-5 text-[#064244] flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search ward name, district (Mandi, Kullu, Kangra), or ID (e.g. HP-MND-02)..."
            className="w-full bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none font-mono"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-[380px] overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 font-mono">
              No matching wards found for "{query}".
            </div>
          ) : (
            filtered.map((w) => (
              <button
                key={w.ward_id}
                onClick={() => {
                  onSelectWard(w.ward_id);
                  onClose();
                }}
                className="w-full p-3 rounded-xl hover:bg-slate-100/80 flex items-center justify-between transition-all text-left font-mono text-xs group"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: w.alert_color }}
                  />
                  <div>
                    <div className="font-bold text-slate-900 group-hover:text-[#064244] transition-colors">
                      {w.ward_name}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {w.district_name} District • ID: {w.ward_id}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-xs"
                    style={{ backgroundColor: w.alert_color }}
                  >
                    {w.risk_score.toFixed(1)} / 100
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-800 transition-colors" />
                </div>
              </button>
            ))
          )}
        </div>

        {/* Quick Hint */}
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 text-[10px] font-mono text-slate-500 flex justify-between">
          <span>Tip: Press <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600 shadow-xs">ESC</kbd> to exit</span>
          <span>Showing {filtered.length} of {wards.length} wards</span>
        </div>
      </div>
    </div>
  );
};
