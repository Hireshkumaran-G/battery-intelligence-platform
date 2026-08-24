import { apiClient } from './client';
import { OverviewSummaryResponse, SystemHealthResponse } from '../types/api';
import { DeploymentSummaryResponse } from '../types/deployment';

export async function fetchHealth(): Promise<SystemHealthResponse> {
  return apiClient<SystemHealthResponse>('/health');
}

export async function fetchOverviewSummary(): Promise<OverviewSummaryResponse> {
  return apiClient<OverviewSummaryResponse>('/overview/summary');
}

export async function fetchDeploymentSummary(): Promise<DeploymentSummaryResponse> {
  return apiClient<DeploymentSummaryResponse>('/deployment/summary');
}
