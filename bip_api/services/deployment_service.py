import json
from pathlib import Path
from typing import List
from bip_api.config import STM32_EXPORT_DIR
from bip_api.schemas.deployment import DeployedModelInfo, DeploymentSummaryResponse

MODEL_METADATA_MAP = {
    "cell_lifetime_model": {
        "name": "Cell Lifetime Early-Cycle Classifier",
        "chemistry": "LFP",
    },
    "lfp_soh_model": {
        "name": "LFP SOH Regressor",
        "chemistry": "LFP",
    },
    "nmc_soh_model": {
        "name": "NMC SOH Regressor",
        "chemistry": "NMC",
    },
    "lco_soh_model": {
        "name": "LCO SOH Regressor",
        "chemistry": "LCO",
    },
}


class DeploymentService:
    @classmethod
    def get_summary(cls) -> DeploymentSummaryResponse:
        models: List[DeployedModelInfo] = []
        target_mcu = "STM32F446RE"

        if STM32_EXPORT_DIR.exists():
            for folder in sorted(STM32_EXPORT_DIR.iterdir()):
                if folder.is_dir():
                    model_id = folder.name
                    meta_files = list(folder.glob("*_metadata.json"))
                    files = [f.name for f in folder.iterdir() if f.is_file()]

                    model_name = MODEL_METADATA_MAP.get(model_id, {}).get("name", model_id)
                    target_chem = MODEL_METADATA_MAP.get(model_id, {}).get("chemistry", "Global")
                    model_type = "DecisionTree"
                    feature_count = 18
                    sampling_rate = 1000.0

                    if meta_files:
                        try:
                            meta_data = json.loads(meta_files[0].read_text(encoding="utf-8"))
                            model_type = meta_data.get("model_type", model_type)
                            feature_count = meta_data.get("feature_count", feature_count)
                            sampling_rate = meta_data.get("sampling_rate_hz", sampling_rate)
                            target_mcu = meta_data.get("target_mcu", target_mcu)
                        except Exception:
                            pass

                    models.append(
                        DeployedModelInfo(
                            model_id=model_id,
                            model_name=model_name,
                            target_chemistry=target_chem,
                            model_type=model_type,
                            feature_count=feature_count,
                            sampling_rate_hz=sampling_rate,
                            target_mcu=target_mcu,
                            files=sorted(files),
                        )
                    )

        return DeploymentSummaryResponse(
            target_mcu=target_mcu,
            total_models=len(models),
            models=models,
        )
