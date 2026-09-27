import React, { useState } from 'react';
import { Waves } from 'lucide-react';

interface StationNode {
  wardId: string;
  stationName: string;
  river: string;
  elevationM: number;
  distanceKm: number;
  stageCm: number;
  dangerStageCm: number;
  flowVelocityMs: number;
  etaHours: number;
  alertLevel: 'NORMAL' | 'ADVISORY' | 'WATCH' | 'WARNING';
}

interface TopographicElevationRibbonProps {
  selectedWardId: string;
  onSelectWard: (wardId: string) => void;
}

const RIVER_CORRIDORS: Record<string, StationNode[]> = {
  Beas: [
    {
      wardId: 'HP-KLU-04',
      stationName: 'Manali Headwaters',
      river: 'Beas Mainstem',
      elevationM: 2050,
      distanceKm: 0,
      stageCm: 140,
      dangerStageCm: 250,
      flowVelocityMs: 5.6,
      etaHours: 0.0,
      alertLevel: 'ADVISORY'
    },
    {
      wardId: 'HP-KLU-01',
      stationName: 'Kullu Valley',
      river: 'Beas Mainstem',
      elevationM: 1220,
      distanceKm: 41,
      stageCm: 210,
      dangerStageCm: 320,
      flowVelocityMs: 4.9,
      etaHours: 1.1,
      alertLevel: 'ADVISORY'
    },
    {
      wardId: 'HP-KLU-03',
      stationName: 'Bhuntar Confluence',
      river: 'Beas Mainstem',
      elevationM: 1080,
      distanceKm: 52,
      stageCm: 265,
      dangerStageCm: 350,
      flowVelocityMs: 4.7,
      etaHours: 1.6,
      alertLevel: 'WATCH'
    },
    {
      wardId: 'HP-MND-03',
      stationName: 'Larji Dam Confluence',
      river: 'Beas Mainstem',
      elevationM: 950,
      distanceKm: 78,
      stageCm: 310,
      dangerStageCm: 380,
      flowVelocityMs: 4.4,
      etaHours: 2.3,
      alertLevel: 'WATCH'
    },
    {
      wardId: 'HP-MND-04',
      stationName: 'Pandoh Dam Gauge',
      river: 'Beas Mainstem',
      elevationM: 850,
      distanceKm: 98,
      stageCm: 395,
      dangerStageCm: 420,
      flowVelocityMs: 4.2,
      etaHours: 2.9,
      alertLevel: 'WARNING'
    },
    {
      wardId: 'HP-MND-01',
      stationName: 'Mandi Sadar',
      river: 'Beas Mainstem',
      elevationM: 760,
      distanceKm: 118,
      stageCm: 380,
      dangerStageCm: 450,
      flowVelocityMs: 3.8,
      etaHours: 3.5,
      alertLevel: 'WATCH'
    },
    {
      wardId: 'HP-MND-05',
      stationName: 'Dharampur Terminal',
      river: 'Beas Mainstem',
      elevationM: 680,
      distanceKm: 142,
      stageCm: 290,
      dangerStageCm: 400,
      flowVelocityMs: 3.5,
      etaHours: 4.2,
      alertLevel: 'ADVISORY'
    }
  ],
  Parbati: [
    {
      wardId: 'HP-KLU-02',
      stationName: 'Manikaran Gorge',
      river: 'Parbati Tributary',
      elevationM: 1760,
      distanceKm: 0,
      stageCm: 285,
      dangerStageCm: 320,
      flowVelocityMs: 5.8,
      etaHours: 0.0,
      alertLevel: 'WARNING'
    },
    {
      wardId: 'HP-KLU-05',
      stationName: 'Kasol Basin',
      river: 'Parbati Tributary',
      elevationM: 1580,
      distanceKm: 12,
      stageCm: 240,
      dangerStageCm: 300,
      flowVelocityMs: 5.1,
      etaHours: 0.4,
      alertLevel: 'WATCH'
    },
    {
      wardId: 'HP-KLU-03',
      stationName: 'Bhuntar Junction',
      river: 'Parbati Confluence',
      elevationM: 1080,
      distanceKm: 34,
      stageCm: 265,
      dangerStageCm: 350,
      flowVelocityMs: 4.5,
      etaHours: 1.2,
      alertLevel: 'WATCH'
    }
  ]
};

export const TopographicElevationRibbon: React.FC<TopographicElevationRibbonProps> = ({
  selectedWardId,
  onSelectWard
}) => {
  const [activeRiver, setActiveRiver] = useState<'Beas' | 'Parbati'>('Beas');
  const stations = RIVER_CORRIDORS[activeRiver];

  const maxElev = stations[0].elevationM;
  const minElev = stations[stations.length - 1].elevationM;
  const totalDrop = maxElev - minElev;

  return (
    <div className="p-5 bg-white border border-slate-200/90 rounded-2xl space-y-4 text-left shadow-sm">
      {/* Header & River Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-[#064244]">
            <Waves className="w-4 h-4 text-[#064244]" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              Topographic Catchment Cross-Section
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                Gravity Gradient: {maxElev}m &rarr; {minElev}m MSL
              </span>
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Upstream-to-downstream hydraulic surge routing • Click any station to inspect ward
            </p>
          </div>
        </div>

        {/* River Basin Switcher */}
        <div className="flex items-center space-x-1.5 text-xs font-semibold">
          <button
            onClick={() => setActiveRiver('Beas')}
            className={`px-3.5 py-1.5 rounded-full border transition-all cursor-pointer ${
              activeRiver === 'Beas'
                ? 'bg-[#064244] border-[#064244] text-white shadow-sm'
                : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200/80'
            }`}
          >
            Beas Mainstem (7 Stns)
          </button>
          <button
            onClick={() => setActiveRiver('Parbati')}
            className={`px-3.5 py-1.5 rounded-full border transition-all cursor-pointer ${
              activeRiver === 'Parbati'
                ? 'bg-[#064244] border-[#064244] text-white shadow-sm'
                : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200/80'
            }`}
          >
            Parbati Gorge (3 Stns)
          </button>
        </div>
      </div>

      {/* Hydraulic Cross-Section Diagram */}
      <div className="relative w-full bg-slate-50 border border-slate-200/80 rounded-2xl p-4 overflow-x-auto">
        <div className="min-w-[680px]">
          {/* Elevation Scale Bar */}
          <div className="flex justify-between items-center text-[11px] font-semibold text-slate-400 mb-2 px-1">
            <span>High Glacier Pass ({maxElev}m)</span>
            <span className="text-slate-500 font-medium">Channel Slope: {(totalDrop / (stations[stations.length - 1].distanceKm || 1)).toFixed(1)} m/km</span>
            <span>Gorge Outlet ({minElev}m)</span>
          </div>

          {/* Interactive Profile Line */}
          <div className="flex flex-col sm:flex-row gap-2 relative pt-1 pb-3 w-full">
            {stations.map((stn, index) => {
              const isSelected = selectedWardId === stn.wardId;
              const dropPercent = Math.round(((maxElev - stn.elevationM) / (totalDrop || 1)) * 100);

              const alertColor =
                stn.alertLevel === 'WARNING'
                  ? '#ef4444'
                  : stn.alertLevel === 'WATCH'
                  ? '#ea580c'
                  : stn.alertLevel === 'ADVISORY'
                  ? '#f59e0b'
                  : '#10b981';

              return (
                <button
                  key={stn.wardId + index}
                  onClick={() => onSelectWard(stn.wardId)}
                  className={`flex-1 group relative text-left p-3 rounded-xl transition-all duration-150 border cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#064244] ${
                    isSelected
                      ? 'bg-teal-50/70 border-2 border-[#064244] ring-2 ring-[#064244]/15 shadow-sm'
                      : 'bg-white hover:bg-slate-100/80 border-slate-200/90 shadow-sm'
                  }`}
                  aria-label={`Select station ${stn.stationName}`}
                >
                  {/* Top Station Badge */}
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-slate-500 font-bold">{stn.elevationM}m</span>
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: alertColor }}
                      title={`Alert status: ${stn.alertLevel}`}
                    />
                  </div>

                  {/* Station Name */}
                  <div className="text-xs font-bold text-slate-900 truncate group-hover:text-[#064244] transition-colors">
                    {stn.stationName}
                  </div>

                  {/* Stage vs Danger */}
                  <div className="text-[11px] text-slate-600 mt-1 flex items-baseline justify-between font-medium">
                    <span>Stage:</span>
                    <span className="font-bold text-slate-900">{stn.stageCm} cm</span>
                  </div>

                  {/* Surge Velocity & ETA */}
                  <div className="text-[10px] text-slate-500 mt-0.5 flex justify-between font-medium">
                    <span>{stn.flowVelocityMs} m/s</span>
                    <span className="text-[#064244] font-semibold">+{stn.etaHours}h ETA</span>
                  </div>

                  {/* Elevation Drop Graphic Bar */}
                  <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2.5 overflow-hidden">
                    <div
                      className="h-full bg-[#064244] rounded-full"
                      style={{ width: `${Math.max(15, 100 - dropPercent)}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Bottom Telemetry Metrics Strip */}
          <div className="grid grid-cols-4 gap-2.5 pt-3 border-t border-slate-200/80 text-xs">
            <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-sm">
              <span className="text-[10px] text-slate-400 font-semibold block uppercase">TOTAL CHANNEL DROP</span>
              <span className="font-bold text-slate-900">{totalDrop} m MSL</span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-sm">
              <span className="text-[10px] text-slate-400 font-semibold block uppercase">SURGE VELOCITY (MANNING)</span>
              <span className="font-bold text-[#064244]">4.8 m/s (17.3 km/h)</span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-sm">
              <span className="text-[10px] text-slate-400 font-semibold block uppercase">CREST ARRIVAL WINDOW</span>
              <span className="font-bold text-amber-700">1h 42m Downstream</span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-sm">
              <span className="text-[10px] text-slate-400 font-semibold block uppercase">SONAR HARDWARE TELEMETRY</span>
              <span className="font-bold text-emerald-700">5 Nodes Synchronized</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
