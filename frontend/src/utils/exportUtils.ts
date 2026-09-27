import { WardRisk } from '../types';

/**
 * Utility functions for exporting Rakshak early warning data in standard formats:
 * - GeoJSON FeatureCollection (for GIS/QGIS/ArcGIS mapping)
 * - CSV Spreadsheet (for tabular reporting and analytics)
 * - NDMA OASIS CAP v1.2 XML (for disaster management agency ingestion)
 */

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportWardsCSV(wards: WardRisk[]) {
  const headers = [
    'Ward ID',
    'Ward Name',
    'District',
    'Risk Score (0-100)',
    'Alert Level',
    'Est. Lead Time (Hours)',
    'Current 24h Rain (mm)',
    'Antecedent 72h Rain (mm)',
    'Elevation (m)',
    'Slope (deg)',
    'Latitude',
    'Longitude',
    'Threat Directive'
  ];

  const rows = wards.map(w => {
    const elev = w.features_summary?.elevation ?? 1200;
    const slope = w.features_summary?.slope ?? 22.5;
    const directive = w.alert_level === 'WARNING'
      ? 'Deploy NDRF quick-response teams, halt riverside and canyon corridor transit'
      : w.alert_level === 'WATCH'
      ? 'Stage field emergency response assets, activate LoRaWAN sonar gauge alerts'
      : w.alert_level === 'ADVISORY'
      ? 'Issue early public safety advisory, monitor catchment cloudburst telemetry'
      : 'Maintain standard regional monsoon surveillance';

    return [
      `"${w.ward_id}"`,
      `"${w.ward_name}"`,
      `"${w.district_name}"`,
      w.risk_score.toFixed(1),
      `"${w.alert_level}"`,
      w.lead_time_hours.toFixed(1),
      w.rainfall_current_24h.toFixed(1),
      w.rainfall_antecedent_72h.toFixed(1),
      Number(elev).toFixed(0),
      Number(slope).toFixed(1),
      w.latitude.toFixed(4),
      w.longitude.toFixed(4),
      `"${directive.replace(/"/g, '""')}"`
    ];
  });

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  downloadFile(csvContent, `rakshak-risk-export-${timestamp}.csv`, 'text/csv;charset=utf-8;');
}

export function exportWardsGeoJSON(geoJsonData: any, wards: WardRisk[]) {
  if (!geoJsonData) return;

  const wardMap = new Map(wards.map(w => [w.ward_id, w]));

  const enrichedGeoJson = {
    ...geoJsonData,
    metadata: {
      generated_at: new Date().toISOString(),
      system: 'Rakshak SIH26192 (NDRF / Ministry of Home Affairs)',
      crs: 'urn:ogc:def:crs:OGC:1.3:CRS84'
    },
    features: (geoJsonData.features || []).map((f: any) => {
      const wardId = f.properties?.ward_id;
      const ward = wardMap.get(wardId);
      const directive = ward?.alert_level === 'WARNING'
        ? 'Deploy NDRF quick-response teams, halt riverside and canyon corridor transit'
        : ward?.alert_level === 'WATCH'
        ? 'Stage field emergency response assets, activate LoRaWAN sonar gauge alerts'
        : ward?.alert_level === 'ADVISORY'
        ? 'Issue early public safety advisory, monitor catchment cloudburst telemetry'
        : 'Maintain standard regional monsoon surveillance';

      return {
        ...f,
        properties: {
          ...f.properties,
          risk_score: ward?.risk_score ?? 0,
          alert_level: ward?.alert_level ?? 'NORMAL',
          alert_color: ward?.alert_color ?? '#10b981',
          lead_time_hours: ward?.lead_time_hours ?? 6.0,
          rainfall_current_24h_mm: ward?.rainfall_current_24h ?? 0,
          rainfall_antecedent_72h_mm: ward?.rainfall_antecedent_72h ?? 0,
          early_warning_directive: directive
        }
      };
    })
  };

  const jsonStr = JSON.stringify(enrichedGeoJson, null, 2);
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  downloadFile(jsonStr, `rakshak-spatial-wards-${timestamp}.geojson`, 'application/geo+json;charset=utf-8;');
}

export async function exportCapAlertXML() {
  try {
    const res = await fetch('/api/v1/alerts/cap.xml');
    if (!res.ok) throw new Error('Failed to fetch CAP XML');
    const xml = await res.text();
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    downloadFile(xml, `rakshak-ndma-cap-${timestamp}.xml`, 'application/xml;charset=utf-8;');
  } catch (err) {
    console.error('Error exporting CAP XML:', err);
    alert('Failed to download NDMA CAP XML feed.');
  }
}
