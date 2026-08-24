from typing import Any, Dict, List, Optional
from pydantic import BaseModel


class ArtifactMeta(BaseModel):
    id: str
    filename: str
    title: str
    description: str
    rows_count: int
    columns: List[str]
    size_bytes: int


class CellCorrelationRecord(BaseModel):
    chemistry: str
    cell_id: str
    poly_order: int
    r_raw: float
    r_norm_vmean: float
    r_norm_firstcyc: float
    p_norm_firstcyc: float
    mean_snr_dB: float
    n_cycles: int
    soh_min: float
    soh_max: float


class FeatureImportanceRecord(BaseModel):
    target: str
    feature: str
    importance: float


class FeatureTransferRecord(BaseModel):
    target: str
    feature: str
    test_chem: str
    train_chems: str
    rmse: Optional[float] = None
    r2: Optional[float] = None
    is_censored: bool = False


class InteractionStatRecord(BaseModel):
    model: str
    formula: str
    r2: float
    aic: float
    f_stat_vs_prev: Optional[float] = None
    p_value_vs_prev: Optional[float] = None


class SignedVsAbsRecord(BaseModel):
    chemistry: str
    degree: int
    mean_signed_r: float
    std_signed_r: float
    mean_abs_r: float
    dominant_direction: str
    n_cells: int


class StrategyComparisonRecord(BaseModel):
    target: str
    chemistry: str
    rmse_strategy_A_global: float
    rmse_strategy_B_specific: float
    rmse_strategy_C_calibrated: float
    r2_strategy_A_global: float
    r2_strategy_B_specific: float
    r2_strategy_C_calibrated: float


class BaselineResultRecord(BaseModel):
    target: str
    chemistry: str
    baseline: str
    rmse: float
    r2: float


class SensitivityStudyRecord(BaseModel):
    chemistry: str
    poly_order: int
    correlation_raw: float
    correlation_norm: float
    p_value_raw: float
    p_value_norm: float
    mean_snr_dB: float


class NmcOutlierRecord(BaseModel):
    cell_id: str
    n_cycles: int
    soh_min: float
    soh_max: float
    temp_mean: float
    snr_deg2_mean: float
    snr_deg2_std: float
    r_norm2_cap: float
    p: float


class SignReversalPhysicsRecord(BaseModel):
    chemistry: str
    cell_id: str
    early_soh: float
    late_soh: float
    delta_ripple_rms_deg2: float
    delta_voltage_mean: float
    delta_voltage_std: float
    delta_voltage_kurtosis: float
    delta_fft_energy: float


class GenericArtifactResponse(BaseModel):
    meta: ArtifactMeta
    records: List[Dict[str, Any]]
