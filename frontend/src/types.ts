export interface FactorContribution {
  factor_name: string;
  display_name: string;
  impact_points: number;
  is_aggravating: boolean;
}

export interface WardRisk {
  ward_id: string;
  ward_name: string;
  district_name: string;
  latitude: number;
  longitude: number;
  risk_score: number;
  alert_level: 'NORMAL' | 'ADVISORY' | 'WATCH' | 'WARNING';
  alert_color: string;
  lead_time_hours: number;
  rainfall_current_24h: number;
  rainfall_antecedent_72h: number;
  is_live_data: boolean;
  last_updated: string;
  severity_label?: string;
  factor_contributions?: FactorContribution[];
  features_summary?: Record<string, any>;
  live_sensor_telemetry?: {
    node_id: string;
    source: string;
    timestamp: string;
    water_level_cm: number;
    water_level_rate_cm_per_hr?: number;
    tilt_angle_deg?: number;
    battery_level_pct?: number;
  } | null;
}

export interface TimeSeriesPoint {
  timestamp: string;
  rainfall_mm: number;
  risk_score: number;
  water_level_cm?: number;
}

export interface ValidationEvent {
  event_id: string;
  date: string;
  district: string;
  ward_id: string;
  location: string;
  event_type: string;
  description: string;
  rainfall_24h_mm: number;
  antecedent_72h_mm: number;
  flood_occurred: number;
  severity: string;
  documented_source: string;
  model_predicted_risk: number;
  model_predicted_level: string;
  prediction_accurate: boolean;
}

export interface ModelInfo {
  model_name: string;
  model_version: string;
  trained_at: string;
  algorithm: string;
  features: string[];
  feature_importances: Record<string, number>;
  literature_benchmark: {
    study_name: string;
    citation: string;
    reported_accuracy: number;
    reported_roc_auc: number;
    context: string;
  };
  measured_validation_metrics: {
    evaluation_window: string;
    validation_wards_count: number;
    test_samples_count: number;
    positive_events_count: number;
    accuracy: number;
    precision: number;
    recall: number;
    f1_score: number;
    roc_auc: number;
    pr_auc: number;
    true_positives: number;
    false_positives: number;
    true_negatives: number;
    false_negatives: number;
  };
  disclaimer: string;
}

export interface EvacuationShelter {
  shelter_id: string;
  shelter_name: string;
  district_name: string;
  ward_id: string;
  ward_name: string;
  latitude: number;
  longitude: number;
  elevation_m: number;
  capacity_persons: number;
  current_occupancy: number;
  supplies_status: 'STOCKED' | 'ADEQUATE' | 'CRITICAL';
  helpline_contact: string;
  distance_km_from_valley: number;
  is_active_staging_area: boolean;
}

export interface SitRepData {
  sitrep_number: string;
  timestamp: string;
  reporting_agency: string;
  operation_codename: string;
  monitored_region: string;
  summary_statistics: {
    total_monitored_wards: number;
    critical_warning_count: number;
    advisory_watch_count: number;
    safe_normal_count: number;
    total_shelter_capacity: number;
    current_shelter_occupancy: number;
    available_shelter_capacity: number;
    active_iot_telemetry_nodes: number;
  };
  critical_wards_details: Array<{
    ward_id: string;
    ward_name: string;
    district: string;
    risk_score: number;
    alert_level: string;
    lead_time_hours: number;
    rainfall_current_24h: number;
    rainfall_antecedent_72h: number;
  }>;
  evacuation_status: {
    designated_shelters_active: number;
    food_medical_readiness: string;
    emergency_helpline: string;
  };
}

export interface SensorNode {
  node_id: string;
  node_name: string;
  ward_id: string;
  ward_name: string;
  district_name: string;
  latitude: number;
  longitude: number;
  river_name: string;
  water_level_cm: number;
  water_level_rate_cm_per_hr: number;
  tilt_angle_deg: number;
  battery_level_pct: number;
  status: 'NORMAL' | 'SURGE_WARNING' | 'DANGER';
  last_ping: string;
}

export interface AlertDispatchRecord {
  dispatch_id: string;
  timestamp: string;
  ward_id: string;
  ward_name: string;
  risk_score: number;
  alert_level: string;
  recipient?: string;
  recipients_count?: number;
  recipients?: string[];
  message_body?: string;
  message_preview?: string;
  status: string;
  provider: string;
  error_detail?: string | null;
}

export interface SimulationResponse {
  simulated_rainfall_24h_mm: number;
  simulated_rainfall_72h_mm: number;
  wards: WardRisk[];
  detailed_ward?: WardRisk | null;
}

export interface AgentExecutionStep {
  agent_name: 'IngestionSentinel' | 'HydrologyReasoner' | 'DispatchCommander';
  phase: 'THOUGHT' | 'ACTION' | 'OBSERVATION';
  detail: string;
  timestamp: string;
  duration_ms?: number;
  confidence_score?: number;
}

export interface TelemetryQualityAudit {
  node_id: string;
  snr_db: number;
  battery_v: number;
  packet_loss_pct: number;
  is_anomalous: boolean;
  confidence_score: number;
  source_status: string;
}

export interface HydrologyDossier {
  ward_id: string;
  ward_name: string;
  rainfall_rate_mmh: number;
  gsi_threshold_limit_mmh: number;
  gsi_threshold_breached: boolean;
  manning_velocity_ms: number;
  downstream_eta_h: number;
  composite_risk_score: number;
  alert_level: string;
  aggravating_factors: string[];
}

export interface EmergencyDirectiveDraft {
  directive_id: string;
  ward_id: string;
  ward_name: string;
  severity: string;
  headline: string;
  instruction_en: string;
  instruction_hi: string;
  cap_xml_preview: string;
  human_approval_required: boolean;
  status: string;
}

export interface AgentTriagePipelineResult {
  pipeline_id: string;
  ward_id: string;
  ward_name: string;
  timestamp: string;
  execution_trace: AgentExecutionStep[];
  telemetry_audit: TelemetryQualityAudit;
  hydrology_dossier: HydrologyDossier;
  directive: EmergencyDirectiveDraft;
  human_review_required: boolean;
  total_duration_ms?: number;
  estimated_tokens?: number;
  agent_latencies_ms?: {
    IngestionSentinel?: number;
    HydrologyReasoner?: number;
    DispatchCommander?: number;
  };
}

export interface ApproveDirectiveResponse {
  directive_id: string;
  status: string;
  broadcast_timestamp: string;
  message: string;
  digital_checksum: string;
}

export interface KiloOrchestrationResponse {
  batch_id: string;
  total_wards: number;
  elapsed_wall_time_ms: number;
  average_latency_ms: number;
  concurrency_limit: number;
  critical_breaches: number;
  watch_alerts: number;
  staged_directives_count: number;
  results: AgentTriagePipelineResult[];
  bottleneck_analysis: {
    fastest_ward: string;
    slowest_ward: string;
    average_confidence_pct: number;
    concurrency_efficiency_gain: number;
    wards_per_second?: number;
    agent_latency_breakdown_ms?: {
      IngestionSentinel?: number;
      HydrologyReasoner?: number;
      DispatchCommander?: number;
    };
    total_estimated_tokens?: number;
    thread_workers_configured?: number;
  };
  status: string;
}

export interface KiloStatusResponse {
  engine_name: string;
  max_concurrency: number;
  active_tasks: number;
  queue_mode: string;
  supported_agents: string[];
  healthy: boolean;
}

export interface HazardReport {
  id: string;
  ward_id: string;
  ward_name: string;
  district_name: string;
  latitude: number;
  longitude: number;
  category: 'crack' | 'seepage' | 'rockfall' | 'water_rising' | 'other';
  photo_url?: string | null;
  description?: string | null;
  reporter_type: 'citizen' | 'field_officer';
  reporter_contact?: string | null;
  status: 'pending' | 'verified' | 'rejected';
  verified_by?: string | null;
  verified_at?: string | null;
  created_at: string;
  risk_boost_applied: boolean;
  applied_boost_percent: number;
}


