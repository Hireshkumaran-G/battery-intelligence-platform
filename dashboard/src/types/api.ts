export interface SystemHealthResponse {
  status: string;
  version: string;
  python_env: string;
  timestamp: string;
}

export interface DatasetInfo {
  name: string;
  chemistry: string;
  cells: number;
  eol_observed: boolean;
  eol_note: string;
  institution: string;
  nominal_capacity_ah: number;
}

export interface ChemistryProfile {
  chemistry: string;
  full_name: string;
  cell_count: number;
  voltage_plateau_type: string;
  ripple_correlation_sign: string;
  mean_r_deg2: number;
  mean_snr_dB: number;
  eol_censored: boolean;
  description: string;
}

export interface ResearchHighlight {
  id: string;
  title: string;
  metric_label: string;
  metric_value: string;
  subtext: string;
  scientific_takeaway: string;
}

export interface OverviewSummaryResponse {
  total_cells: number;
  chemistries: string[];
  chemistry_counts: Record<string, number>;
  datasets: DatasetInfo[];
  chemistry_profiles: ChemistryProfile[];
  highlights: ResearchHighlight[];
  deployed_models_count: number;
  target_mcu: string;
}
