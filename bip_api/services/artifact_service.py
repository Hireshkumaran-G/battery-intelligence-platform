import math
from pathlib import Path
from typing import Any, Dict, List, Optional
import pandas as pd
import numpy as np

from bip_api.config import ARTIFACTS_DIR
from bip_api.schemas.artifacts import (
    ArtifactMeta,
    CellCorrelationRecord,
    FeatureImportanceRecord,
    FeatureTransferRecord,
    InteractionStatRecord,
    SignedVsAbsRecord,
    StrategyComparisonRecord,
    BaselineResultRecord,
    SensitivityStudyRecord,
    NmcOutlierRecord,
    SignReversalPhysicsRecord,
)

ARTIFACT_REGISTRY = {
    "cell_correlation_audit": {
        "filename": "cell_correlation_audit.csv",
        "title": "Cell Correlation Audit (Poly Orders 1–6)",
        "description": "Per-cell Pearson correlation between capacity and normalized ripple components across LFP, NMC, and LCO."
    },
    "feature_importances": {
        "filename": "feature_importances.csv",
        "title": "Random Forest Feature Importance Ablation",
        "description": "Global feature importance weights for SOH and RUL degradation prediction."
    },
    "feature_transfer_study": {
        "filename": "feature_transfer_study.csv",
        "title": "Single-Feature LOCO Transferability Study",
        "description": "Leave-One-Chemistry-Out generalization error (RMSE, R²) per individual descriptor (with right-censored LFP RUL)."
    },
    "interaction_analysis_stats": {
        "filename": "interaction_analysis_stats.csv",
        "title": "Chemistry Interaction Analysis (ANOVA)",
        "description": "Nested linear regression models demonstrating statistically significant chemistry dependence (F = 6364.57, p < 0.0001)."
    },
    "signed_vs_abs_correlation": {
        "filename": "signed_vs_abs_correlation.csv",
        "title": "Signed vs. Absolute Correlation Across Poly Orders",
        "description": "Mean signed r vs. absolute |r| across polynomial orders 1–6 for LFP, NMC, and LCO."
    },
    "strategy_comparison_results": {
        "filename": "strategy_comparison_results.csv",
        "title": "3-Strategy Modeling Benchmark (GroupKFold)",
        "description": "Benchmark comparing Global (A), Chemistry-Specific (B), and Shared+Calibrated (C) architectures."
    },
    "within_chemistry_results": {
        "filename": "within_chemistry_results.csv",
        "title": "Within-Chemistry Baseline Benchmarks (B0–B4)",
        "description": "Within-chemistry performance across Naive (B0), Voltage-only (B1), Conventional (B2), Ripple-only (B3), and Combined (B4)."
    },
    "loco_chemistry_results": {
        "filename": "loco_chemistry_results.csv",
        "title": "Multi-Feature LOCO Generalization (B0–B4)",
        "description": "Leave-One-Chemistry-Out cross-validation performance across feature baselines B0 through B4."
    },
    "sensitivity_study_results": {
        "filename": "sensitivity_study_results.csv",
        "title": "Polynomial Detrending Sensitivity Study",
        "description": "Correlation and SNR metrics across polynomial degrees 1 through 6 across all three chemistries."
    },
    "nmc_outlier_summary": {
        "filename": "nmc_outlier_summary.csv",
        "title": "Oxford NMC Cell Outlier & Operating Diagnostic",
        "description": "Cell-level SNR, temperature bounds, cycle counts, and capacity correlation metrics for NMC."
    },
    "sign_reversal_physics_summary": {
        "filename": "sign_reversal_physics_summary.csv",
        "title": "NMC Ripple Sign Reversal Physical Deltas",
        "description": "Early vs. late SOH physical parameter shifts (ripple RMS, voltage kurtosis, FFT energy) explaining the NMC sign reversal."
    },
}


class ArtifactService:
    _cache: Dict[str, pd.DataFrame] = {}

    @classmethod
    def _load_df(cls, filename: str) -> pd.DataFrame:
        if filename in cls._cache:
            return cls._cache[filename]

        file_path = ARTIFACTS_DIR / filename
        if not file_path.exists():
            raise FileNotFoundError(f"Artifact CSV not found: {file_path}")

        # Read CSV, replacing standard null representations
        df = pd.read_csv(file_path)
        cls._cache[filename] = df
        return df

    @classmethod
    def list_artifacts(cls) -> List[ArtifactMeta]:
        metas = []
        for key, info in ARTIFACT_REGISTRY.items():
            filename = info["filename"]
            file_path = ARTIFACTS_DIR / filename
            if file_path.exists():
                df = cls._load_df(filename)
                metas.append(
                    ArtifactMeta(
                        id=key,
                        filename=filename,
                        title=info["title"],
                        description=info["description"],
                        rows_count=len(df),
                        columns=list(df.columns),
                        size_bytes=file_path.stat().st_size,
                    )
                )
        return metas

    @classmethod
    def get_raw_csv_path(cls, filename: str) -> Path:
        file_path = ARTIFACTS_DIR / filename
        if not file_path.exists():
            raise FileNotFoundError(f"Artifact CSV file '{filename}' does not exist on disk.")
        return file_path

    @classmethod
    def get_cell_correlations(cls) -> List[CellCorrelationRecord]:
        df = cls._load_df("cell_correlation_audit.csv")
        records = []
        for _, row in df.iterrows():
            records.append(
                CellCorrelationRecord(
                    chemistry=str(row["chemistry"]),
                    cell_id=str(row["cell_id"]),
                    poly_order=int(row["poly_order"]),
                    r_raw=float(row["r_raw"]),
                    r_norm_vmean=float(row["r_norm_vmean"]),
                    r_norm_firstcyc=float(row["r_norm_firstcyc"]),
                    p_norm_firstcyc=float(row["p_norm_firstcyc"]),
                    mean_snr_dB=float(row["mean_snr_dB"]),
                    n_cycles=int(row["n_cycles"]),
                    soh_min=float(row["soh_min"]),
                    soh_max=float(row["soh_max"]),
                )
            )
        return records

    @classmethod
    def get_feature_importances(cls) -> List[FeatureImportanceRecord]:
        df = cls._load_df("feature_importances.csv")
        records = []
        for _, row in df.iterrows():
            records.append(
                FeatureImportanceRecord(
                    target=str(row["target"]),
                    feature=str(row["feature"]),
                    importance=float(row["importance"]),
                )
            )
        return records

    @classmethod
    def get_feature_transfer(cls) -> List[FeatureTransferRecord]:
        df = cls._load_df("feature_transfer_study.csv")
        records = []
        for _, row in df.iterrows():
            rmse_val = row.get("rmse")
            r2_val = row.get("r2")

            is_censored = pd.isna(rmse_val) or (isinstance(rmse_val, float) and math.isnan(rmse_val))
            records.append(
                FeatureTransferRecord(
                    target=str(row["target"]),
                    feature=str(row["feature"]),
                    test_chem=str(row["test_chem"]),
                    train_chems=str(row["train_chems"]),
                    rmse=None if is_censored else float(rmse_val),
                    r2=None if is_censored else float(r2_val),
                    is_censored=bool(is_censored),
                )
            )
        return records

    @classmethod
    def get_interaction_stats(cls) -> List[InteractionStatRecord]:
        df = cls._load_df("interaction_analysis_stats.csv")
        records = []
        for _, row in df.iterrows():
            f_stat = row.get("f_stat_vs_prev")
            p_val = row.get("p_value_vs_prev")

            f_is_none = pd.isna(f_stat) or (isinstance(f_stat, float) and math.isnan(f_stat))
            p_is_none = pd.isna(p_val) or (isinstance(p_val, float) and math.isnan(p_val))

            records.append(
                InteractionStatRecord(
                    model=str(row["model"]),
                    formula=str(row["formula"]),
                    r2=float(row["r2"]),
                    aic=float(row["aic"]),
                    f_stat_vs_prev=None if f_is_none else float(f_stat),
                    p_value_vs_prev=None if p_is_none else float(p_val),
                )
            )
        return records

    @classmethod
    def get_signed_vs_abs(cls) -> List[SignedVsAbsRecord]:
        df = cls._load_df("signed_vs_abs_correlation.csv")
        records = []
        for _, row in df.iterrows():
            records.append(
                SignedVsAbsRecord(
                    chemistry=str(row["chemistry"]),
                    degree=int(row["degree"]),
                    mean_signed_r=float(row["mean_signed_r"]),
                    std_signed_r=float(row["std_signed_r"]),
                    mean_abs_r=float(row["mean_abs_r"]),
                    dominant_direction=str(row["dominant_direction"]),
                    n_cells=int(row["n_cells"]),
                )
            )
        return records

    @classmethod
    def get_strategy_comparison(cls) -> List[StrategyComparisonRecord]:
        df = cls._load_df("strategy_comparison_results.csv")
        records = []
        for _, row in df.iterrows():
            records.append(
                StrategyComparisonRecord(
                    target=str(row["target"]),
                    chemistry=str(row["chemistry"]),
                    rmse_strategy_A_global=float(row["rmse_strategy_A_global"]),
                    rmse_strategy_B_specific=float(row["rmse_strategy_B_specific"]),
                    rmse_strategy_C_calibrated=float(row["rmse_strategy_C_calibrated"]),
                    r2_strategy_A_global=float(row["r2_strategy_A_global"]),
                    r2_strategy_B_specific=float(row["r2_strategy_B_specific"]),
                    r2_strategy_C_calibrated=float(row["r2_strategy_C_calibrated"]),
                )
            )
        return records

    @classmethod
    def get_generic_artifact_records(cls, artifact_id: str) -> Dict[str, Any]:
        if artifact_id not in ARTIFACT_REGISTRY:
            raise KeyError(f"Unknown artifact id: {artifact_id}")

        info = ARTIFACT_REGISTRY[artifact_id]
        filename = info["filename"]
        df = cls._load_df(filename)
        file_path = ARTIFACTS_DIR / filename

        meta = ArtifactMeta(
            id=artifact_id,
            filename=filename,
            title=info["title"],
            description=info["description"],
            rows_count=len(df),
            columns=list(df.columns),
            size_bytes=file_path.stat().st_size,
        )

        # Clean NaN values for JSON safety
        records = df.replace({np.nan: None}).to_dict(orient="records")
        return {"meta": meta, "records": records}
