from typing import List
from pydantic import BaseModel


class DeployedModelInfo(BaseModel):
    model_id: str
    model_name: str
    target_chemistry: str
    model_type: str
    feature_count: int
    sampling_rate_hz: float
    target_mcu: str
    files: List[str]


class DeploymentSummaryResponse(BaseModel):
    target_mcu: str
    total_models: int
    models: List[DeployedModelInfo]
