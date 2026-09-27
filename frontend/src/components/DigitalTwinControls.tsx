import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, FastForward, Clock, Waves, Droplets, Mountain, ShieldAlert } from 'lucide-react';
import { DIGITAL_TWIN_STEPS, SimulationStep } from '../services/digitalTwinSimulator';

interface DigitalTwinControlsProps {
  currentStepIndex: number;
  onStepChange: (index: number) => void;
  onResetToLive: () => void;
  isSimulating: boolean;
}

export const DigitalTwinControls: React.FC<DigitalTwinControlsProps> = ({
  currentStepIndex,
  onStepChange,
  onResetToLive,
  isSimulating
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1); // 1x, 2x, 4x
  const timerRef = useRef<any>(null);

  const activeStep = DIGITAL_TWIN_STEPS[currentStepIndex] || DIGITAL_TWIN_STEPS[0];

  useEffect(() => {
    if (isPlaying) {
      const intervalMs = Math.max(800, 3000 / playbackSpeed);
      timerRef.current = setInterval(() => {
        onStepChange((currentStepIndex + 1) % DIGITAL_TWIN_STEPS.length);
      }, intervalMs);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, currentStepIndex, playbackSpeed]);

  const togglePlay = () => {
    setIsPlaying(prev => !prev);
  };

  const handleSpeedCycle = () => {
    setPlaybackSpeed(prev => (prev === 1 ? 2 : prev === 2 ? 4 : 1));
  };

  const handleReset = () => {
    setIsPlaying(false);
    onResetToLive();
  };

  const getIntensityBadge = (intensity: SimulationStep['stormIntensity']) => {
    switch (intensity) {
      case 'EXTREME_CLOUDBURST':
      case 'RUNOFF_SURGE':
      case 'MAINSTEM_CREST':
        return 'bg-red-950 text-red-300 border-red-800 animate-pulse';
      case 'GORGE_BOTTLENECK':
      case 'BUILDING':
        return 'bg-amber-950 text-amber-300 border-amber-800';
      default:
        return 'bg-emerald-950 text-emerald-300 border-emerald-800';
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-4 text-slate-800">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-[#064244]">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                4D Hydrological Digital Twin Time-Lapse
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  PHYSICAL TIMELINE
                </span>
              </h3>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Synchronized simulation of cloudburst development, soil infiltration, and Beas river floodwave crest
            </p>
          </div>
        </div>

        {/* Playback Controls Toolbar */}
        <div className="flex items-center space-x-2 text-xs font-semibold">
          <button
            onClick={togglePlay}
            className={`px-3.5 py-1.5 rounded-xl flex items-center space-x-1.5 font-semibold transition-all cursor-pointer ${
              isPlaying
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-[#064244] hover:bg-[#032e30] text-white shadow-sm'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Play Simulation</span>
              </>
            )}
          </button>

          <button
            onClick={handleSpeedCycle}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200 flex items-center space-x-1 transition-all cursor-pointer"
            title="Cycle Playback Speed"
          >
            <FastForward className="w-3.5 h-3.5" />
            <span>{playbackSpeed}x</span>
          </button>

          {isSimulating && (
            <button
              onClick={handleReset}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200 flex items-center space-x-1 transition-all cursor-pointer"
              title="Reset to Real-Time Live Feeds"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden sm:inline">Reset to Live</span>
            </button>
          )}
        </div>
      </div>

      {/* Timeline Scrubber Milestones */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 px-1">
          {DIGITAL_TWIN_STEPS.map((step, idx) => (
            <button
              key={step.timeLabel}
              onClick={() => onStepChange(idx)}
              className={`flex flex-col items-center transition-all cursor-pointer ${
                idx === currentStepIndex
                  ? 'text-[#064244] font-bold scale-110'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <span className="text-[10px] sm:text-xs">{step.timeLabel}</span>
              <span className={`w-2.5 h-2.5 rounded-full mt-1 border transition-all ${
                idx === currentStepIndex
                  ? 'bg-[#064244] border-white ring-2 ring-[#064244]/25 shadow-sm'
                  : 'bg-slate-300 border-slate-400'
              }`} />
            </button>
          ))}
        </div>

        {/* Range Progress Bar */}
        <input
          type="range"
          min={0}
          max={DIGITAL_TWIN_STEPS.length - 1}
          value={currentStepIndex}
          onChange={(e) => onStepChange(parseInt(e.target.value, 10))}
          className="w-full accent-[#064244] cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none"
        />
      </div>

      {/* Active Phase Banner & Telemetry Gauges */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 pt-1">
        {/* Left Phase Description */}
        <div className="lg:col-span-6 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-[10px] uppercase font-semibold">Current Simulation Phase</span>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getIntensityBadge(activeStep.stormIntensity)}`}>
              {activeStep.phase}
            </span>
          </div>
          <p className="text-slate-700 text-xs mt-1.5 leading-relaxed font-sans font-medium">
            {activeStep.description}
          </p>
        </div>

        {/* Right 4 Hydrological Gauges */}
        <div className="lg:col-span-6 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] text-slate-500 font-semibold block flex items-center gap-1">
              <Droplets className="w-3 h-3 text-[#064244]" /> 24h RAIN
            </span>
            <strong className="text-slate-900 text-sm">{activeStep.rainfallCurrent24h} mm</strong>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] text-slate-500 font-semibold block flex items-center gap-1">
              <Mountain className="w-3 h-3 text-amber-600" /> SOIL SAT
            </span>
            <strong className={`${activeStep.soilMoisturePct > 85 ? 'text-red-600' : 'text-amber-700'} text-sm`}>
              {activeStep.soilMoisturePct}%
            </strong>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] text-slate-500 font-semibold block flex items-center gap-1">
              <Waves className="w-3 h-3 text-[#064244]" /> RIVER STAGE
            </span>
            <strong className={`${activeStep.riverStageCm > 400 ? 'text-red-600' : 'text-[#064244]'} text-sm`}>
              {activeStep.riverStageCm} cm
            </strong>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] text-slate-500 font-semibold block flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-red-600" /> WAVE SPEED
            </span>
            <strong className="text-emerald-700 text-sm">{activeStep.surgeVelocityMs} m/s</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
