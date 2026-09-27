import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { WardRisk, ValidationEvent, SensorNode, HazardReport } from '../types';
import { Layers, Eye, Mountain, Zap, Globe, Map as MapIcon } from 'lucide-react';

interface MapProps {
  wards: WardRisk[];
  selectedWard: WardRisk | null;
  onSelectWard: (wardId: string) => void;
  validationEvents: ValidationEvent[];
  geoJsonData: any;
  sensors?: SensorNode[];
  reports?: HazardReport[];
  onVerifyReport?: (id: string, action: 'verify' | 'reject') => void;
}

type MapLayerType = 'satellite' | 'hybrid' | 'gis' | 'topo' | 'dark';

// Topological River Catchment Vectors for Himachal Pradesh
const RIVER_CASCADES = [
  {
    id: 'beas_mainstem',
    name: 'Beas River Mainstem',
    color: '#38bdf8',
    coords: [
      [32.2396, 77.1887], // Manali (2050m)
      [31.9578, 77.1095], // Kullu Valley (1220m)
      [31.8790, 77.1520], // Bhuntar Confluence
      [31.7190, 77.2280], // Larji Dam Confluence
      [31.6703, 77.0542], // Pandoh Dam (850m)
      [31.7087, 76.9320], // Mandi Sadar (760m)
      [31.8150, 76.7820]  // Dharampur (680m)
    ] as [number, number][],
    velocity: '4.8 m/s',
    gradient: '24 m/km',
    stations: [
      { name: 'Manali Headwater Gauge', lat: 32.2396, lng: 77.1887, elev: 2050, type: 'Headwater' },
      { name: 'Kullu Valley Station', lat: 31.9578, lng: 77.1095, elev: 1220, type: 'Valley Floor' },
      { name: 'Pandoh Gorge Dam', lat: 31.6703, lng: 77.0542, elev: 850, type: 'Hydro Dam' },
      { name: 'Mandi Victoria Bridge', lat: 31.7087, lng: 76.9320, elev: 760, type: 'Gorge Choke' }
    ]
  },
  {
    id: 'parbati_tributary',
    name: 'Parbati River Tributary',
    color: '#a78bfa',
    coords: [
      [32.0270, 77.3510], // Manikaran (1760m)
      [32.0100, 77.3150], // Kasol (1580m)
      [31.8790, 77.1520]  // Bhuntar Confluence (1080m)
    ] as [number, number][],
    velocity: '5.6 m/s',
    gradient: '38 m/km',
    stations: [
      { name: 'Manikaran Gorge', lat: 32.0270, lng: 77.3510, elev: 1760, type: 'V-Notch Valley' },
      { name: 'Kasol Bridge Confluence', lat: 32.0100, lng: 77.3150, elev: 1580, type: 'Rapid Confluence' }
    ]
  },
  {
    id: 'tirthan_tributary',
    name: 'Tirthan River Tributary',
    color: '#34d399',
    coords: [
      [31.6360, 77.4080], // Gushaini (1500m)
      [31.6380, 77.3450], // Banjar (1350m)
      [31.7190, 77.2280]  // Larji Confluence (950m)
    ] as [number, number][],
    velocity: '4.2 m/s',
    gradient: '32 m/km',
    stations: [
      { name: 'Gushaini Catchment', lat: 31.6360, lng: 77.4080, elev: 1500, type: 'Steep Basin' },
      { name: 'Banjar Valley Station', lat: 31.6380, lng: 77.3450, elev: 1350, type: 'Tehsil Basin' }
    ]
  }
];

export const MapChoropleth: React.FC<MapProps> = ({
  wards,
  selectedWard,
  onSelectWard,
  validationEvents,
  geoJsonData,
  sensors = [],
  reports = [],
  onVerifyReport
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const currentTileLayerRef = useRef<L.TileLayer | null>(null);
  const currentOverlayLayerRef = useRef<L.TileLayer | null>(null);
  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const sensorsLayerRef = useRef<L.LayerGroup | null>(null);
  const riversLayerRef = useRef<L.LayerGroup | null>(null);
  const reportsLayerRef = useRef<L.LayerGroup | null>(null);

  const [activeLayer, setActiveLayer] = useState<MapLayerType>('satellite');
  const [showEvents, setShowEvents] = useState<boolean>(true);
  const [showSensors, setShowSensors] = useState<boolean>(true);
  const [showRivers, setShowRivers] = useState<boolean>(true);
  const [showReports, setShowReports] = useState<boolean>(true);
  const [isMobileLegendOpen, setIsMobileLegendOpen] = useState<boolean>(false);

  // Tile layers definition (100% Free, Zero API Key / Billing Cost)
  const TILE_LAYERS = {
    satellite: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Esri, Maxar, Earthstar Geographics | SRTM 30m',
      overlayUrl: null
    },
    hybrid: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Esri, Maxar, Earthstar Geographics | Boundaries & Places',
      overlayUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'
    },
    gis: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Esri World Topo Map | GIS Contours & Boundaries',
      overlayUrl: null
    },
    topo: {
      url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      attribution: '&copy; OpenTopoMap (CC-BY-SA)',
      overlayUrl: null
    },
    dark: {
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      attribution: '&copy; CARTO | OpenStreetMap contributors',
      overlayUrl: null
    }
  };

  // 1. Initialize Leaflet Map Instance
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [31.95, 76.95],
      zoom: 9,
      minZoom: 8,
      maxZoom: 15,
      zoomControl: false
    });

    // Add initial base tile layer (Satellite by default for high-end look)
    const initialConfig = TILE_LAYERS.satellite;
    const tileLayer = L.tileLayer(initialConfig.url, {
      attribution: initialConfig.attribution,
      maxZoom: 18
    }).addTo(map);
    currentTileLayerRef.current = tileLayer;

    // Zoom controls on top-left
    L.control.zoom({ position: 'topleft' }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    sensorsLayerRef.current = L.layerGroup().addTo(map);
    riversLayerRef.current = L.layerGroup().addTo(map);
    reportsLayerRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Switch Base Tile Layer
  const handleLayerSwitch = (type: MapLayerType) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (currentTileLayerRef.current) {
      map.removeLayer(currentTileLayerRef.current);
    }
    if (currentOverlayLayerRef.current) {
      map.removeLayer(currentOverlayLayerRef.current);
      currentOverlayLayerRef.current = null;
    }

    const config = TILE_LAYERS[type];
    const newLayer = L.tileLayer(config.url, {
      attribution: config.attribution,
      maxZoom: 18
    }).addTo(map);

    currentTileLayerRef.current = newLayer;

    if (config.overlayUrl) {
      const overlayLayer = L.tileLayer(config.overlayUrl, {
        maxZoom: 18
      }).addTo(map);
      currentOverlayLayerRef.current = overlayLayer;
    }

    setActiveLayer(type);
  };

  // 3. Render GeoJSON Ward Polygons
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !geoJsonData) return;

    if (geoJsonLayerRef.current) {
      map.removeLayer(geoJsonLayerRef.current);
    }

    const wardRiskMap = new Map(wards.map(w => [w.ward_id, w]));

    const geoLayer = L.geoJSON(geoJsonData, {
      style: (feature) => {
        const wardId = feature?.properties?.ward_id;
        const ward = wardRiskMap.get(wardId);
        const isSelected = selectedWard?.ward_id === wardId;
        const isHighDanger = ward?.alert_level === 'WARNING' || ward?.alert_level === 'WATCH';

        return {
          fillColor: ward?.alert_color || '#10b981',
          weight: isSelected ? 3.5 : (isHighDanger ? 2.5 : 1.5),
          opacity: 1,
          color: isSelected ? '#38bdf8' : (isHighDanger ? '#ef4444' : '#64748b'),
          dashArray: isSelected ? '' : (isHighDanger ? '' : '3'),
          fillOpacity: isSelected ? 0.75 : (activeLayer === 'satellite' ? 0.45 : 0.55)
        };
      },
      onEachFeature: (feature, layer) => {
        const wardId = feature?.properties?.ward_id;
        const ward = wardRiskMap.get(wardId);

        layer.on({
          click: () => {
            if (wardId) onSelectWard(wardId);
          },
          mouseover: (e) => {
            const l = e.target;
            l.setStyle({
              weight: 3.5,
              color: '#38bdf8',
              fillOpacity: 0.8
            });
          },
          mouseout: (e) => {
            geoLayer.resetStyle(e.target);
          }
        });

        if (ward) {
          layer.bindTooltip(
            `<div class="font-sans text-xs p-1">
              <div class="font-bold text-white text-sm">${ward.ward_name}</div>
              <div class="text-slate-300 font-mono mt-0.5">Risk Score: <strong>${ward.risk_score.toFixed(1)}/100</strong></div>
              <div class="font-mono text-[11px]" style="color: ${ward.alert_color};">Alert: <strong>${ward.alert_level}</strong></div>
              <div class="text-slate-400 font-mono text-[10px] mt-0.5">Est. Lead Time: ${ward.lead_time_hours.toFixed(1)} hrs</div>
            </div>`,
            { sticky: true, className: 'tactical-tooltip' }
          );
        }
      }
    }).addTo(map);

    geoJsonLayerRef.current = geoLayer;
  }, [geoJsonData, wards, selectedWard, onSelectWard, activeLayer]);

  // 4. Update Historical 2025 Event Markers
  useEffect(() => {
    const markersGroup = markersLayerRef.current;
    if (!markersGroup) return;

    markersGroup.clearLayers();
    if (!showEvents) return;

    const wardMap = new Map(wards.map(w => [w.ward_id, w]));

    validationEvents.forEach(ev => {
      const ward = wardMap.get(ev.ward_id);
      if (!ward) return;

      const lat = ward.latitude + 0.015;
      const lon = ward.longitude + 0.015;

      const markerIcon = L.divIcon({
        className: 'custom-event-marker',
        html: `<div class="w-6 h-6 rounded-full bg-red-600/90 border-2 border-white shadow-[0_0_12px_#ef4444] flex items-center justify-center text-xs text-white font-black animate-pulse" aria-label="Cloudburst Event ${ev.location}">!</div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const marker = L.marker([lat, lon], { icon: markerIcon });
      marker.bindPopup(
        `<div class="p-2.5 font-sans max-w-xs text-xs">
          <span class="px-2 py-0.5 rounded text-[10px] font-mono bg-red-950 text-red-300 border border-red-800 font-bold">
            2025 CLOUDBURST GROUND TRUTH
          </span>
          <h4 class="font-bold text-slate-100 text-sm mt-1.5">${ev.location}</h4>
          <div class="text-slate-400 text-[11px] font-mono">${ev.date} • ${ev.district} District</div>
          <p class="text-slate-200 mt-1.5 leading-relaxed">${ev.description}</p>
          <div class="mt-2.5 pt-2 border-t border-slate-700/80 font-mono text-[11px] flex justify-between items-center">
            <span>24h Rain: <strong class="text-white">${ev.rainfall_24h_mm} mm</strong></span>
            <span class="text-emerald-400 font-bold flex items-center gap-1"><svg class="w-3 h-3 inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Model Alert Verified</span>
          </div>
          <div class="text-[10px] text-slate-400 mt-1 italic">Source: ${ev.documented_source}</div>
        </div>`,
        { className: 'tactical-popup' }
      );

      markersGroup.addLayer(marker);
    });
  }, [validationEvents, wards, showEvents]);

  // 5. Update IoT Field Sensors Layer
  useEffect(() => {
    const sensorsGroup = sensorsLayerRef.current;
    if (!sensorsGroup) return;

    sensorsGroup.clearLayers();
    if (!showSensors) return;

    sensors.forEach(node => {
      const isSurge = node.status === 'SURGE_WARNING' || node.water_level_cm > 400;

      const sensorIcon = L.divIcon({
        className: 'custom-sensor-marker',
        html: `
          <div class="relative flex items-center justify-center">
            <div class="absolute w-8 h-8 rounded-full ${isSurge ? 'bg-red-500/40 animate-ping' : 'bg-cyan-500/30 animate-pulse'}"></div>
            <div class="w-6 h-6 rounded-full ${isSurge ? 'bg-red-600 border-red-300 shadow-[0_0_12px_#ef4444]' : 'bg-cyan-600 border-cyan-300 shadow-[0_0_12px_#06b6d4]'} border-2 flex items-center justify-center text-white text-[10px] font-black z-10">
              <svg class="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            </div>
            <div class="absolute -bottom-4 bg-slate-900/90 border border-slate-700 px-1.5 py-0.2 rounded text-[9px] font-mono text-white whitespace-nowrap shadow">
              ${node.water_level_cm.toFixed(0)}cm
            </div>
          </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker([node.latitude, node.longitude], { icon: sensorIcon });
      marker.bindPopup(
        `<div class="p-2.5 font-sans max-w-xs text-xs">
          <span class="px-2 py-0.5 rounded text-[10px] font-mono ${isSurge ? 'bg-red-950 text-red-300 border border-red-800' : 'bg-cyan-950 text-cyan-300 border border-cyan-800'} font-bold">
            ${isSurge ? 'SURGE ANOMALY DETECTED' : 'IOT RIVER GAUGE ACTIVE'}
          </span>
          <h4 class="font-bold text-slate-100 text-sm mt-1.5">${node.node_id}</h4>
          <div class="text-slate-400 text-[11px] font-mono">${node.node_name} (${node.river_name}) • Ward: ${node.ward_id}</div>
          
          <div class="grid grid-cols-2 gap-2 mt-2 font-mono text-[11px] bg-slate-900/70 p-2 rounded border border-slate-800">
            <div>
              <span class="text-slate-400 text-[10px] block">WATER STAGE</span>
              <strong class="${isSurge ? 'text-red-400' : 'text-cyan-400'} text-xs">${node.water_level_cm.toFixed(1)} cm</strong>
            </div>
            <div>
              <span class="text-slate-400 text-[10px] block">SURGE RATE</span>
              <strong class="text-white text-xs">${node.water_level_rate_cm_per_hr.toFixed(1)} cm/h</strong>
            </div>
            <div>
              <span class="text-slate-400 text-[10px] block">TILT SENSOR</span>
              <strong class="${node.tilt_angle_deg > 5.0 ? 'text-amber-400' : 'text-slate-300'} text-xs">${node.tilt_angle_deg.toFixed(1)}°</strong>
            </div>
            <div>
              <span class="text-slate-400 text-[10px] block">BATTERY</span>
              <strong class="text-emerald-400 text-xs">${node.battery_level_pct.toFixed(0)}%</strong>
            </div>
          </div>
          <div class="mt-2 text-[10px] text-slate-400 font-mono">Telemetry stream: LoRaWAN 868MHz Gateway (SX1276)</div>
        </div>`,
        { className: 'tactical-popup' }
      );

      sensorsGroup.addLayer(marker);
    });
  }, [sensors, showSensors]);

  // 6. Update River Cascades & Catchment Vectors Layer
  useEffect(() => {
    const riversGroup = riversLayerRef.current;
    if (!riversGroup) return;

    riversGroup.clearLayers();
    if (!showRivers) return;

    RIVER_CASCADES.forEach(river => {
      // Glow background line
      const glowLine = L.polyline(river.coords, {
        color: river.color,
        weight: 6,
        opacity: 0.35,
        lineCap: 'round',
        lineJoin: 'round'
      });

      // Core crisp vector line with arrow dashes
      const coreLine = L.polyline(river.coords, {
        color: river.color,
        weight: 3,
        opacity: 0.9,
        dashArray: '10, 6',
        lineCap: 'round'
      });

      const popupContent = `
        <div class="p-2.5 font-sans max-w-xs text-xs">
          <span class="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold uppercase">
            Hydrological River Cascade
          </span>
          <h4 class="font-bold text-slate-100 text-sm mt-1" style="color: ${river.color}">${river.name}</h4>
          <div class="grid grid-cols-2 gap-2 mt-2 font-mono text-[11px] bg-slate-900/80 p-2 rounded border border-slate-800">
            <div>
              <span class="text-slate-400 text-[10px] block">SURGE VELOCITY</span>
              <strong class="text-white text-xs">${river.velocity}</strong>
            </div>
            <div>
              <span class="text-slate-400 text-[10px] block">AVG GRADIENT</span>
              <strong class="text-white text-xs">${river.gradient}</strong>
            </div>
          </div>
          <p class="text-slate-300 text-[11px] mt-2">
            Downstream Manning propagation channel. Cloudbursts at headwaters transit downstream within 1.5 to 4.5 hours.
          </p>
        </div>
      `;

      coreLine.bindPopup(popupContent, { className: 'tactical-popup' });
      coreLine.bindTooltip(`<strong>${river.name}</strong> (${river.velocity})`, { sticky: true, className: 'tactical-tooltip' });

      riversGroup.addLayer(glowLine);
      riversGroup.addLayer(coreLine);

      // Add Station Confluence Markers
      river.stations.forEach(st => {
        const stationIcon = L.divIcon({
          className: 'custom-river-station',
          html: `<div class="w-3.5 h-3.5 rounded-full bg-slate-950 border-2 shadow-md flex items-center justify-center cursor-pointer" style="border-color: ${river.color}; box-shadow: 0 0 8px ${river.color};">
                   <div class="w-1.5 h-1.5 rounded-full" style="background-color: ${river.color}"></div>
                 </div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7]
        });

        const stMarker = L.marker([st.lat, st.lng], { icon: stationIcon });
        stMarker.bindTooltip(
          `<div class="font-sans text-xs">
            <strong>${st.name}</strong> (${st.elev}m)
            <div class="text-[10px] text-slate-400 font-mono">${st.type} • ${river.name}</div>
          </div>`,
          { sticky: true, className: 'tactical-tooltip' }
        );
        riversGroup.addLayer(stMarker);
      });
    });
  }, [showRivers]);

  // 7. Update Citizen Hazard Reports Layer
  useEffect(() => {
    const reportsGroup = reportsLayerRef.current;
    if (!reportsGroup) return;

    reportsGroup.clearLayers();
    if (!showReports) return;

    reports.forEach(rep => {
      let pinColor = '#94a3b8'; // Grey for pending
      let badgeLabel = 'PENDING OFFICER VERIFICATION';
      if (rep.status === 'verified') {
        pinColor = '#10b981'; // Green for verified
        badgeLabel = `VERIFIED (+${rep.applied_boost_percent || 15}% RISK BOOST ACTIVE)`;
      } else if (rep.status === 'rejected') {
        pinColor = '#ef4444'; // Red for rejected
        badgeLabel = 'REJECTED REPORT';
      }

      const reportIcon = L.divIcon({
        className: 'custom-hazard-report-marker',
        html: `
          <div class="relative flex items-center justify-center cursor-pointer">
            <div class="w-6 h-6 rounded-full border-2 border-white shadow-md flex items-center justify-center text-xs font-bold text-white z-10" style="background-color: ${pinColor}">
              ⚠️
            </div>
          </div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      (window as any).__onVerifyReport = onVerifyReport;

      const marker = L.marker([rep.latitude, rep.longitude], { icon: reportIcon });
      const popupHtml = `
        <div class="p-2.5 font-sans max-w-xs text-xs space-y-1.5">
          <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase" style="background-color: ${pinColor}20; color: ${pinColor}">
            ${badgeLabel}
          </span>
          <h4 class="font-bold text-slate-100 text-sm capitalize mt-1">${rep.category.replace('_', ' ')} Report</h4>
          <div class="text-slate-400 text-[11px] font-mono">${rep.ward_name} (${rep.district_name})</div>
          ${rep.description ? `<p class="text-slate-300 text-[11px] leading-relaxed bg-slate-900/60 p-1.5 rounded border border-slate-800">${rep.description}</p>` : ''}
          <div class="text-[10px] text-slate-400 font-mono">Reporter: ${rep.reporter_type} • ${new Date(rep.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
          
          ${rep.status === 'pending' ? `
            <div class="pt-2 flex items-center space-x-1.5 border-t border-slate-700/80">
              <button onclick="window.__onVerifyReport && window.__onVerifyReport('${rep.id}', 'verify')" class="flex-1 py-1 px-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-[10px] shadow">
                ✓ Verify (+15% Boost)
              </button>
              <button onclick="window.__onVerifyReport && window.__onVerifyReport('${rep.id}', 'reject')" class="py-1 px-2 bg-slate-800 hover:bg-red-900 text-slate-300 hover:text-white rounded font-bold text-[10px]">
                Reject
              </button>
            </div>
          ` : ''}
        </div>
      `;

      marker.bindPopup(popupHtml, { className: 'tactical-popup' });
      reportsGroup.addLayer(marker);
    });
  }, [reports, showReports, onVerifyReport]);

  // 7. Auto-pan to selected ward
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedWard) return;

    map.flyTo([selectedWard.latitude, selectedWard.longitude], 11, {
      duration: 1.2,
      easeLinearity: 0.25
    });
  }, [selectedWard?.ward_id]);

  return (
    <div className="relative w-full h-[580px] rounded-2xl overflow-hidden border border-slate-200/90 bg-white shadow-sm">
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full z-10" />

      {/* Commusoft Top-Left Status Overlay */}
      <div className="absolute top-3 left-3 z-20 pointer-events-none flex items-center gap-2 bg-white/95 backdrop-blur-md border border-slate-200/80 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 shadow-sm">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="tracking-wide">Surveillance Stream</span>
        <span className="text-slate-300">•</span>
        <span className="text-slate-500 text-[11px] font-mono">DEM 30m</span>
      </div>

      {/* Floating Controls Overlay (Top Right) */}
      <div className="absolute top-3 right-3 z-20 flex flex-col items-end space-y-2 pointer-events-auto">
        {/* Layer Switcher (Satellite, Hybrid, GIS Topo, Topo Elevation, Dark HUD) */}
        <div
          role="group"
          aria-label="Map Base Layer Switcher"
          className="bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-xl p-1 flex items-center space-x-1 shadow-sm overflow-x-auto max-w-full"
        >
          <button
            onClick={() => handleLayerSwitch('satellite')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all whitespace-nowrap ${
              activeLayer === 'satellite'
                ? 'bg-[#064244] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
            aria-label="Switch to High-Resolution Satellite Imagery Layer (ESRI World Imagery)"
            title="High-Resolution Satellite Imagery (ESRI)"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Satellite</span>
          </button>

          <button
            onClick={() => handleLayerSwitch('hybrid')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all whitespace-nowrap ${
              activeLayer === 'hybrid'
                ? 'bg-[#064244] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
            aria-label="Switch to Satellite Hybrid Layer with Labels"
            title="Satellite Imagery with Road & Tehsil Labels"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Hybrid</span>
          </button>

          <button
            onClick={() => handleLayerSwitch('gis')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all whitespace-nowrap ${
              activeLayer === 'gis'
                ? 'bg-[#064244] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
            aria-label="Switch to ESRI GIS Topo Layer"
            title="ESRI GIS Topographic Map"
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>GIS Map</span>
          </button>

          <button
            onClick={() => handleLayerSwitch('topo')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all whitespace-nowrap ${
              activeLayer === 'topo'
                ? 'bg-[#064244] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
            aria-label="Switch to Elevation Topographical Contours Layer (OpenTopoMap)"
            title="OpenTopoMap Elevation Contours"
          >
            <Mountain className="w-3.5 h-3.5" />
            <span>Topo</span>
          </button>

          <button
            onClick={() => handleLayerSwitch('dark')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all whitespace-nowrap ${
              activeLayer === 'dark'
                ? 'bg-[#064244] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
            aria-label="Switch to Dark Tactical Canvas"
            title="Dark HUD Canvas"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Dark</span>
          </button>
        </div>

        {/* Feature Toggles (Rivers, Sensors, Events, Reports) */}
        <div className="bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-xl p-2 flex items-center space-x-3 text-xs font-medium text-slate-700 shadow-sm flex-wrap gap-y-1">
          <label className="flex items-center space-x-1.5 cursor-pointer hover:text-slate-900">
            <input
              type="checkbox"
              checked={showRivers}
              onChange={(e) => setShowRivers(e.target.checked)}
              className="accent-[#064244] rounded cursor-pointer"
            />
            <span>Rivers</span>
          </label>

          <label className="flex items-center space-x-1.5 cursor-pointer hover:text-slate-900">
            <input
              type="checkbox"
              checked={showSensors}
              onChange={(e) => setShowSensors(e.target.checked)}
              className="accent-[#064244] rounded cursor-pointer"
            />
            <span>IoT Sonar</span>
          </label>

          <label className="flex items-center space-x-1.5 cursor-pointer hover:text-slate-900">
            <input
              type="checkbox"
              checked={showReports}
              onChange={(e) => setShowReports(e.target.checked)}
              className="accent-[#064244] rounded cursor-pointer"
            />
            <span>Citizen Reports</span>
          </label>

          <label className="flex items-center space-x-1.5 cursor-pointer hover:text-slate-900">
            <input
              type="checkbox"
              checked={showEvents}
              onChange={(e) => setShowEvents(e.target.checked)}
              className="accent-[#ea580c] rounded cursor-pointer"
            />
            <span>2025 Events</span>
          </label>
        </div>
      </div>

      {/* Commusoft Signature Floating Summary & Legend Widget (Bottom Left) */}
      <div className="absolute bottom-3 left-3 z-20 pointer-events-auto">
        <button
          onClick={() => setIsMobileLegendOpen(!isMobileLegendOpen)}
          className="sm:hidden flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold shadow-sm min-h-[36px]"
          aria-expanded={isMobileLegendOpen}
          aria-label="Toggle Risk Legend"
        >
          <span>Summary</span>
        </button>

        <div
          className={`${
            isMobileLegendOpen ? 'block' : 'hidden sm:block'
          } mt-2 sm:mt-0 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-3.5 shadow-md max-w-[320px] text-xs space-y-2.5 text-slate-800 animate-fadeIn`}
          role="complementary"
          aria-label="Basin summary and risk classification"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="font-bold text-slate-900 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Basin Telemetry Overview
            </span>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              {activeLayer} Mode
            </span>
          </div>

          {/* Floating Metric Cells */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-1.5">
              <div className="text-[10px] text-slate-500 font-semibold uppercase">Total</div>
              <div className="text-sm font-bold text-slate-900 tabular-nums">{wards.length} Wards</div>
            </div>
            <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-1.5">
              <div className="text-[10px] text-amber-700 font-semibold uppercase">Advisory</div>
              <div className="text-sm font-bold text-amber-800 tabular-nums">
                {wards.filter(w => w.alert_level === 'ADVISORY').length}
              </div>
            </div>
            <div className="bg-red-50 border border-red-200/60 rounded-xl p-1.5">
              <div className="text-[10px] text-red-700 font-semibold uppercase">Critical</div>
              <div className="text-sm font-bold text-red-800 tabular-nums">
                {wards.filter(w => w.alert_level === 'WARNING' || w.alert_level === 'WATCH').length}
              </div>
            </div>
          </div>

          {/* Risk Classification Pills */}
          <div className="pt-1 border-t border-slate-100 space-y-1.5">
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px]">
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-slate-600">Normal (&lt;40)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-yellow-500" />
                <span className="text-slate-600">Advisory (40-60)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-orange-500" />
                <span className="text-slate-600">Watch (60-80)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-slate-700 font-bold">Warning (&gt;80)</span>
              </div>
            </div>

            <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
              <span className="flex items-center gap-1 font-medium text-emerald-700">
                <Zap className="w-3 h-3 text-emerald-600 inline" aria-hidden="true" /> {sensors.length} Sonar Nodes
              </span>
              <span className="flex items-center gap-1 font-medium text-red-600">
                <span className="w-1.5 h-1.5 rounded-full bg-red-600 inline-block animate-ping" /> Historic Groundtruth
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
