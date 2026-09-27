import { WardRisk, SensorNode } from '../types';

/**
 * 4D Hydrological Digital Twin Simulator for Rakshak.
 * Simulates temporal wave propagation and convective cloudburst dynamics
 * across Himachal Pradesh mountain catchments (Beas, Parbati, and Tirthan).
 */

export interface SimulationStep {
  timeOffsetHours: number; // -3, -1, 0, 1.5, 3, 4.5, 6
  timeLabel: string;
  phase: string;
  stormIntensity: 'LOW' | 'BUILDING' | 'EXTREME_CLOUDBURST' | 'RUNOFF_SURGE' | 'MAINSTEM_CREST' | 'GORGE_BOTTLENECK' | 'RECESSION';
  description: string;
  rainfallCurrent24h: number;
  rainfallAntecedent72h: number;
  soilMoisturePct: number;
  riverStageCm: number;
  regionalRiskMultiplier: number;
  surgeVelocityMs: number;
}

export const DIGITAL_TWIN_STEPS: SimulationStep[] = [
  {
    timeOffsetHours: -3,
    timeLabel: 'T - 3.0h',
    phase: 'Antecedent Saturation',
    stormIntensity: 'LOW',
    description: 'Pre-storm convective cloud formation detected over Seraj ridge. Soil moisture steady at 62%.',
    rainfallCurrent24h: 35.0,
    rainfallAntecedent72h: 80.0,
    soilMoisturePct: 62.0,
    riverStageCm: 145.0,
    regionalRiskMultiplier: 0.65,
    surgeVelocityMs: 1.8
  },
  {
    timeOffsetHours: -1,
    timeLabel: 'T - 1.0h',
    phase: 'Orographic Moisture Intercept',
    stormIntensity: 'BUILDING',
    description: 'High-velocity updrafts condense against mountain slopes (>25°). Rainfall intensifies to 45 mm/h.',
    rainfallCurrent24h: 75.0,
    rainfallAntecedent72h: 120.0,
    soilMoisturePct: 78.0,
    riverStageCm: 210.0,
    regionalRiskMultiplier: 0.95,
    surgeVelocityMs: 2.8
  },
  {
    timeOffsetHours: 0,
    timeLabel: 'T 0.0h',
    phase: 'Localized Cloudburst Event',
    stormIntensity: 'EXTREME_CLOUDBURST',
    description: 'Intense cloudburst burst (>135 mm/h) over Thunag and Seraj basin headwaters. Soil saturation exceeds 94%.',
    rainfallCurrent24h: 185.0,
    rainfallAntecedent72h: 210.0,
    soilMoisturePct: 94.0,
    riverStageCm: 340.0,
    regionalRiskMultiplier: 1.85,
    surgeVelocityMs: 4.8
  },
  {
    timeOffsetHours: 1.5,
    timeLabel: 'T + 1.5h',
    phase: 'Steep Catchment Concentration',
    stormIntensity: 'RUNOFF_SURGE',
    description: 'Gravity-driven sheet wash rushes down narrow V-notch gorges. IoT sonar registers surge rate of 58 cm/h.',
    rainfallCurrent24h: 215.0,
    rainfallAntecedent72h: 240.0,
    soilMoisturePct: 98.0,
    riverStageCm: 445.0,
    regionalRiskMultiplier: 2.15,
    surgeVelocityMs: 5.4
  },
  {
    timeOffsetHours: 3.0,
    timeLabel: 'T + 3.0h',
    phase: 'Mainstem Floodwave Crest',
    stormIntensity: 'MAINSTEM_CREST',
    description: 'Debris-laden floodwave transits downstream to Beas valley floor. Inundation alert active at Pandoh & Kullu.',
    rainfallCurrent24h: 195.0,
    rainfallAntecedent72h: 260.0,
    soilMoisturePct: 92.0,
    riverStageCm: 485.0,
    regionalRiskMultiplier: 2.30,
    surgeVelocityMs: 4.2
  },
  {
    timeOffsetHours: 4.5,
    timeLabel: 'T + 4.5h',
    phase: 'Gorge Bottleneck Backwater',
    stormIntensity: 'GORGE_BOTTLENECK',
    description: 'Peak discharge compresses into Mandi Victoria Bridge gorge bottleneck. Downstream dissipation begins.',
    rainfallCurrent24h: 140.0,
    rainfallAntecedent72h: 250.0,
    soilMoisturePct: 86.0,
    riverStageCm: 410.0,
    regionalRiskMultiplier: 1.65,
    surgeVelocityMs: 3.6
  },
  {
    timeOffsetHours: 6.0,
    timeLabel: 'T + 6.0h',
    phase: 'Storm Dissipation & Recession',
    stormIntensity: 'RECESSION',
    description: 'Convective cell moves eastward into Greater Himalayas. Channel discharge transitions to steady recession.',
    rainfallCurrent24h: 85.0,
    rainfallAntecedent72h: 220.0,
    soilMoisturePct: 74.0,
    riverStageCm: 260.0,
    regionalRiskMultiplier: 1.10,
    surgeVelocityMs: 2.4
  }
];

export function applyDigitalTwinStep(
  wards: WardRisk[],
  step: SimulationStep,
  activeSensors: SensorNode[]
): { updatedWards: WardRisk[]; updatedSensors: SensorNode[] } {
  const updatedWards = wards.map(w => {
    // Seraj/Mandi wards (e.g. HP-MND-02, HP-MND-04) receive primary storm focus
    const isPrimaryBasin = w.district_name.toLowerCase() === 'mandi' || w.ward_id === 'HP-MND-02';
    const multiplier = isPrimaryBasin ? step.regionalRiskMultiplier : Math.max(0.7, step.regionalRiskMultiplier * 0.75);

    const rawScore = Math.min(99.5, Math.max(12.0, w.risk_score * multiplier));
    let alert_level: 'NORMAL' | 'ADVISORY' | 'WATCH' | 'WARNING' = 'NORMAL';
    let alert_color = '#10b981';

    if (rawScore >= 80) {
      alert_level = 'WARNING';
      alert_color = '#ef4444';
    } else if (rawScore >= 60) {
      alert_level = 'WATCH';
      alert_color = '#f97316';
    } else if (rawScore >= 40) {
      alert_level = 'ADVISORY';
      alert_color = '#eab308';
    }

    const leadTime = alert_level === 'WARNING' ? Math.max(1.5, 6.0 - Math.max(0, step.timeOffsetHours)) : 6.0;

    return {
      ...w,
      risk_score: Number(rawScore.toFixed(1)),
      alert_level,
      alert_color,
      lead_time_hours: Number(leadTime.toFixed(1)),
      rainfall_current_24h: Number((step.rainfallCurrent24h * (isPrimaryBasin ? 1.0 : 0.7)).toFixed(1)),
      rainfall_antecedent_72h: Number((step.rainfallAntecedent72h * (isPrimaryBasin ? 1.0 : 0.8)).toFixed(1))
    };
  });

  const updatedSensors = activeSensors.map(s => {
    const isSurge = step.riverStageCm > 400;
    return {
      ...s,
      water_level_cm: Number((step.riverStageCm + (Math.sin(s.latitude * 10) * 15)).toFixed(1)),
      water_level_rate_cm_per_hr: step.stormIntensity === 'RUNOFF_SURGE' ? 58.0 : step.stormIntensity === 'EXTREME_CLOUDBURST' ? 42.0 : 8.0,
      status: isSurge ? ('SURGE_WARNING' as const) : ('NORMAL' as const)
    };
  });

  return { updatedWards, updatedSensors };
}
