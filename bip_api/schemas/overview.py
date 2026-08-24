from typing import Dict, List, Optional
from pydantic import BaseModel


class SystemHealthResponse(BaseModel):
    status: str
    version: str
    python_env: str
    timestamp: str


class DatasetInfo(BaseModel):
    name: str
    chemistry: str
    cells: int
    eol_observed: bool
    eol_note: str
    institution: str
    nominal_capacity_ah: float


class ChemistryProfile(BaseModel):
    chemistry: str
    full_name: str
    cell_count: int
    voltage_plateau_type: str
    ripple_correlation_sign: str
    mean_r_deg2: Optional[float] = None
    mean_snr_dB: Optional[float] = None
    eol_censored: bool
    description: str


class ResearchHighlight(BaseModel):
    id: str
    title: str
    metric_label: str
    metric_value: str
    subtext: str
    scientific_takeaway: str


class OverviewSummaryResponse(BaseModel):
    total_cells: int
    chemistries: List[str]
    chemistry_counts: Dict[str, int]
    datasets: List[DatasetInfo]
    chemistry_profiles: List[ChemistryProfile]
    highlights: List[ResearchHighlight]
    deployed_models_count: int
    target_mcu: str
