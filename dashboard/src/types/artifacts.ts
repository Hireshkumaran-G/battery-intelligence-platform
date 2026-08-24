export interface ArtifactMeta {
  id: string;
  filename: string;
  title: string;
  description: string;
  rows_count: number;
  columns: string[];
  size_bytes: number;
}

export interface CellCorrelationRecord {
  chemistry: string;
  cell_id: string;
  poly_order: number;
  r_raw: number;
  r_norm_vmean: number;
  r_norm_firstcyc: number;
  p_norm_firstcyc: number;
  mean_snr_dB: number;
  n_cycles: number;
  soh_min: number;
  soh_max: number;
}

export interface FeatureImportanceRecord {
  target: string;
  feature: string;
  importance: number;
}

export interface FeatureTransferRecord {
  target: string;
  feature: string;
  test_chem: string;
  train_chems: string;
  rmse: number | null;
  r2: number | null;
  is_censored: boolean;
}

export interface InteractionStatRecord {
  model: string;
  formula: string;
  r2: number;
  aic: number;
  f_stat_vs_prev: number | null;
  p_value_vs_prev: number | null;
}

export interface SignedVsAbsRecord {
  chemistry: string;
  degree: number;
  mean_signed_r: number;
  std_signed_r: number;
  mean_abs_r: number;
  dominant_direction: string;
  n_cells: number;
}

export interface StrategyComparisonRecord {
  target: string;
  chemistry: string;
  rmse_strategy_A_global: number;
  rmse_strategy_B_specific: number;
  rmse_strategy_C_calibrated: number;
  r2_strategy_A_global: number;
  r2_strategy_B_specific: number;
  r2_strategy_C_calibrated: number;
}

export interface BaselineResultRecord {
  target: string;
  chemistry: string;
  baseline: string;
  rmse: number;
  r2: number;
}

export interface SensitivityStudyRecord {
  chemistry: string;
  poly_order: number;
  correlation_raw: number;
  correlation_norm: number;
  p_value_raw: number;
  p_value_norm: number;
  mean_snr_dB: number;
}

export interface NmcOutlierRecord {
  cell_id: string;
  n_cycles: number;
  soh_min: number;
  soh_max: number;
  temp_mean: number;
  snr_deg2_mean: number;
  snr_deg2_std: number;
  r_norm2_cap: number;
  p: number;
}

export interface SignReversalPhysicsRecord {
  chemistry: string;
  cell_id: string;
  early_soh: number;
  late_soh: number;
  delta_ripple_rms_deg2: number;
  delta_voltage_mean: number;
  delta_voltage_std: number;
  delta_voltage_kurtosis: number;
  delta_fft_energy: number;
}

export interface GenericArtifactResponse {
  meta: ArtifactMeta;
  records: Record<string, any>[];
}
