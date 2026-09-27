import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { TimeSeriesPoint } from '../types';
import { Table } from 'lucide-react';

interface ChartProps {
  points: TimeSeriesPoint[];
  wardName: string;
}

export const TimeSeriesChart: React.FC<ChartProps> = ({ points, wardName }) => {
  const { t } = useTranslation();
  const [showRainfall, setShowRainfall] = useState<boolean>(true);
  const [showRiskScore, setShowRiskScore] = useState<boolean>(true);
  const [showRiverLevel, setShowRiverLevel] = useState<boolean>(true);
  const [showTable, setShowTable] = useState<boolean>(false);

  return (
    <div className="p-5 bg-white border border-slate-200/90 rounded-2xl space-y-4 text-left shadow-sm">
      {/* Header & Series Toggles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
            {t('rainfall_chart_title')}
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              48h Hydrograph
            </span>
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Catchment: <strong className="text-slate-800">{wardName}</strong> • Discharge & Rainfall Runoff
          </p>
        </div>

        {/* Action Controls: Table View & Series Toggles */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          {/* Rainfall Toggle */}
          <button
            onClick={() => setShowRainfall(!showRainfall)}
            className={`px-3 py-1.5 rounded-xl border transition-all flex items-center space-x-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10b981] ${
              showRainfall
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-semibold shadow-xs'
                : 'bg-slate-100 border-slate-200 text-slate-400 line-through'
            }`}
            aria-pressed={showRainfall}
            aria-label="Toggle Rainfall Series"
          >
            <span className="w-2.5 h-2.5 rounded-sm bg-[#10b981]" />
            <span>Rain (mm)</span>
          </button>

          {/* Risk Score Toggle */}
          <button
            onClick={() => setShowRiskScore(!showRiskScore)}
            className={`px-3 py-1.5 rounded-xl border transition-all flex items-center space-x-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ea580c] ${
              showRiskScore
                ? 'bg-orange-50 border-orange-200 text-orange-800 font-semibold shadow-xs'
                : 'bg-slate-100 border-slate-200 text-slate-400 line-through'
            }`}
            aria-pressed={showRiskScore}
            aria-label="Toggle Risk Score Series"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#ea580c]" />
            <span>Risk Index</span>
          </button>

          {/* River Level Toggle */}
          <button
            onClick={() => setShowRiverLevel(!showRiverLevel)}
            className={`px-3 py-1.5 rounded-xl border transition-all flex items-center space-x-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#064244] ${
              showRiverLevel
                ? 'bg-teal-50 border-teal-200 text-[#064244] font-semibold shadow-xs'
                : 'bg-slate-100 border-slate-200 text-slate-400 line-through'
            }`}
            aria-pressed={showRiverLevel}
            aria-label="Toggle River Stage Series"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#064244]" />
            <span>River (cm)</span>
          </button>

          {/* Accessible Table Alternative */}
          <button
            onClick={() => setShowTable(!showTable)}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200 font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#064244]"
            aria-expanded={showTable}
            aria-label="Toggle Data Table Alternative for Screen Readers"
            title="Accessible Tabular View"
          >
            <Table className="w-3.5 h-3.5 text-slate-500" />
            <span>{showTable ? 'Chart View' : 'Table View'}</span>
          </button>
        </div>
      </div>

      {/* Accessible Table View Alternative (WCAG 1.3.1) */}
      {showTable ? (
        <div className="overflow-x-auto max-h-[260px] rounded-xl border border-slate-200 text-xs animate-fadeIn">
          <table className="w-full text-left border-collapse" aria-label={`Hydrograph Data for ${wardName}`}>
            <thead className="bg-slate-50 text-slate-600 font-semibold sticky top-0 border-b border-slate-200">
              <tr>
                <th className="p-2.5">Time</th>
                <th className="p-2.5 text-emerald-700">Rainfall (mm)</th>
                <th className="p-2.5 text-orange-700">Risk Index (0-100)</th>
                <th className="p-2.5 text-[#064244]">River Stage (cm)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {points.map((p, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="p-2.5 text-slate-600 font-mono">{p.timestamp}</td>
                  <td className="p-2.5 font-bold text-slate-900">{p.rainfall_mm.toFixed(1)}</td>
                  <td className="p-2.5 font-bold text-orange-700">{p.risk_score.toFixed(1)}</td>
                  <td className="p-2.5 font-bold text-[#064244]">{p.water_level_cm ? `${p.water_level_cm.toFixed(1)} cm` : 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Recharts Visual Composed Hydrograph */
        <div className="w-full h-[260px]" role="img" aria-label={`Hydrograph chart for ${wardName}`}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={points} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="timestamp"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                minTickGap={24}
                fontFamily="inherit"
              />
              <YAxis
                yAxisId="left"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                domain={[0, 100]}
                fontFamily="inherit"
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#064244"
                fontSize={11}
                tickLine={false}
                domain={[0, 500]}
                fontFamily="inherit"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e2e8f0',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: '#0f172a',
                  fontFamily: 'inherit',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
                }}
              />
              {showRainfall && (
                <Bar
                  yAxisId="left"
                  dataKey="rainfall_mm"
                  name="Rainfall (mm)"
                  fill="#10b981"
                  opacity={0.85}
                  radius={[4, 4, 0, 0]}
                />
              )}
              {showRiskScore && (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="risk_score"
                  name="Risk Score"
                  stroke="#ea580c"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: '#ea580c', stroke: '#ffffff' }}
                />
              )}
              {showRiverLevel && (
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="water_level_cm"
                  name="River Level (cm)"
                  stroke="#064244"
                  strokeWidth={2.5}
                  strokeDasharray="4 4"
                  dot={false}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
