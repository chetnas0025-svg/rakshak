import React, { useState } from 'react';
import { Sliders, Zap, RotateCcw } from 'lucide-react';

interface SimulationSandboxProps {
  onApplySimulation: (simRain24h: number, simRain72h: number) => void;
  onReset: () => void;
}

export const SimulationSandbox: React.FC<SimulationSandboxProps> = ({
  onApplySimulation,
  onReset
}) => {
  const [rain24h, setRain24h] = useState<number>(120);
  const [rain72h, setRain72h] = useState<number>(180);
  const [isSimulating, setIsSimulating] = useState(false);

  const handleSimulate = () => {
    setIsSimulating(true);
    onApplySimulation(rain24h, rain72h);
    setTimeout(() => setIsSimulating(false), 600);
  };

  const handlePresetCloudburst = () => {
    setRain24h(195);
    setRain72h(260);
    onApplySimulation(195, 260);
  };

  const handlePresetDry = () => {
    setRain24h(10);
    setRain72h(25);
    onApplySimulation(10, 25);
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-4 text-slate-800">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#ea580c]">
            <Sliders className="w-4 h-4 text-[#ea580c]" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900">
              Hydrological Cloudburst Simulation Sandbox
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Interactive What-If parameter stress test across catchment polygons
            </p>
          </div>
        </div>
        <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
          What-If Engine
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        {/* 24h Rain Slider */}
        <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
          <div className="flex justify-between text-slate-700 font-medium">
            <span>24h Cloudburst Rainfall:</span>
            <strong className="text-[#ea580c] text-sm font-bold">{rain24h} mm</strong>
          </div>
          <input
            type="range"
            min="0"
            max="250"
            step="5"
            value={rain24h}
            onChange={(e) => setRain24h(Number(e.target.value))}
            className="w-full accent-[#ea580c] cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none"
            aria-label="Simulated 24-hour rainfall in millimeters"
          />
          <div className="flex justify-between text-[11px] text-slate-500 font-medium">
            <span>0 mm (Dry)</span>
            <span>100 mm (Heavy)</span>
            <span className="text-red-600 font-bold">250 mm (Extreme)</span>
          </div>
        </div>

        {/* 72h Rain Slider */}
        <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
          <div className="flex justify-between text-slate-700 font-medium">
            <span>72h Antecedent Saturation:</span>
            <strong className="text-[#064244] text-sm font-bold">{rain72h} mm</strong>
          </div>
          <input
            type="range"
            min="0"
            max="350"
            step="10"
            value={rain72h}
            onChange={(e) => setRain72h(Number(e.target.value))}
            className="w-full accent-[#064244] cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none"
            aria-label="Simulated 72-hour antecedent rainfall in millimeters"
          />
          <div className="flex justify-between text-[11px] text-slate-500 font-medium">
            <span>0 mm (Normal)</span>
            <span>150 mm (Saturated)</span>
            <span className="text-[#064244] font-bold">350 mm (Super-Sat)</span>
          </div>
        </div>
      </div>

      {/* Preset Buttons & Apply Action */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs font-semibold">
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePresetCloudburst}
            className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Preset: Cloudburst (195mm)</span>
          </button>
          <button
            onClick={handlePresetDry}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200 transition-all cursor-pointer"
          >
            <span>Preset: Dry Monsoon (10mm)</span>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onReset}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-600 transition-all cursor-pointer"
            title="Reset Simulation to Live Feeds"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleSimulate}
            disabled={isSimulating}
            className="px-4 py-2 rounded-xl bg-[#ea580c] hover:bg-[#c2410c] active:bg-[#9a3412] text-white font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{isSimulating ? 'Computing Hydro-Model...' : 'Apply Simulation'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
