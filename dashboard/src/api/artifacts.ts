import { apiClient } from './client';
import {
  ArtifactMeta,
  CellCorrelationRecord,
  FeatureImportanceRecord,
  FeatureTransferRecord,
  GenericArtifactResponse,
  InteractionStatRecord,
  SignedVsAbsRecord,
  StrategyComparisonRecord,
  BaselineResultRecord,
  SensitivityStudyRecord,
  NmcOutlierRecord,
  SignReversalPhysicsRecord,
} from '../types/artifacts';

export async function fetchArtifactsList(): Promise<ArtifactMeta[]> {
  return apiClient<ArtifactMeta[]>('/artifacts/list');
}

export async function fetchCellCorrelations(): Promise<CellCorrelationRecord[]> {
  return apiClient<CellCorrelationRecord[]>('/artifacts/cell-correlations');
}

export async function fetchFeatureImportances(): Promise<FeatureImportanceRecord[]> {
  return apiClient<FeatureImportanceRecord[]>('/artifacts/feature-importances');
}

export async function fetchFeatureTransfer(): Promise<FeatureTransferRecord[]> {
  return apiClient<FeatureTransferRecord[]>('/artifacts/feature-transfer');
}

export async function fetchInteractionStats(): Promise<InteractionStatRecord[]> {
  return apiClient<InteractionStatRecord[]>('/artifacts/interaction-stats');
}

export async function fetchSignedVsAbs(): Promise<SignedVsAbsRecord[]> {
  return apiClient<SignedVsAbsRecord[]>('/artifacts/signed-vs-abs');
}

export async function fetchStrategyComparison(): Promise<StrategyComparisonRecord[]> {
  return apiClient<StrategyComparisonRecord[]>('/artifacts/strategy-comparison');
}

export async function fetchWithinChemistry(): Promise<BaselineResultRecord[]> {
  return apiClient<BaselineResultRecord[]>('/artifacts/within-chemistry');
}

export async function fetchLocoChemistry(): Promise<BaselineResultRecord[]> {
  return apiClient<BaselineResultRecord[]>('/artifacts/loco-chemistry');
}

export async function fetchSensitivityStudy(): Promise<SensitivityStudyRecord[]> {
  return apiClient<SensitivityStudyRecord[]>('/artifacts/sensitivity-study');
}

export async function fetchNmcOutliers(): Promise<NmcOutlierRecord[]> {
  return apiClient<NmcOutlierRecord[]>('/artifacts/nmc-outliers');
}

export async function fetchSignReversalSummary(): Promise<SignReversalPhysicsRecord[]> {
  return apiClient<SignReversalPhysicsRecord[]>('/artifacts/sign-reversal-summary');
}

export async function fetchGenericArtifact(artifactId: string): Promise<GenericArtifactResponse> {
  return apiClient<GenericArtifactResponse>(`/artifacts/generic/${artifactId}`);
}

export function getRawArtifactDownloadUrl(filename: string): string {
  const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';
  return `${BASE_URL}/artifacts/raw/${filename}`;
}
