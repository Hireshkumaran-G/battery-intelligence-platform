export interface DeployedModelInfo {
  model_id: string;
  model_name: string;
  target_chemistry: string;
  model_type: string;
  feature_count: number;
  sampling_rate_hz: number;
  target_mcu: string;
  files: string[];
}

export interface DeploymentSummaryResponse {
  target_mcu: string;
  total_models: number;
  models: DeployedModelInfo[];
}
