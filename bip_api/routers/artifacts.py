from typing import Any, Dict, List
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
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
    GenericArtifactResponse,
)
from bip_api.services.artifact_service import ArtifactService

router = APIRouter(prefix="/artifacts", tags=["Research Artifacts"])


@router.get("/list", response_model=List[ArtifactMeta])
async def list_artifacts():
    """List metadata for all 11 pre-computed research CSV artifacts."""
    return ArtifactService.list_artifacts()


@router.get("/cell-correlations", response_model=List[CellCorrelationRecord])
async def get_cell_correlations():
    """Get cell-level polynomial detrending correlation audit (120 rows)."""
    return ArtifactService.get_cell_correlations()


@router.get("/feature-importances", response_model=List[FeatureImportanceRecord])
async def get_feature_importances():
    """Get Random Forest feature importance ablation weights for SOH and RUL."""
    return ArtifactService.get_feature_importances()


@router.get("/feature-transfer", response_model=List[FeatureTransferRecord])
async def get_feature_transfer():
    """Get single-feature Leave-One-Chemistry-Out (LOCO) transfer metrics (with right-censored LFP RUL)."""
    return ArtifactService.get_feature_transfer()


@router.get("/interaction-stats", response_model=List[InteractionStatRecord])
async def get_interaction_stats():
    """Get chemistry interaction ANOVA stats proving sign reversal significance."""
    return ArtifactService.get_interaction_stats()


@router.get("/signed-vs-abs", response_model=List[SignedVsAbsRecord])
async def get_signed_vs_abs():
    """Get mean signed vs. absolute correlation comparison across polynomial degrees 1–6."""
    return ArtifactService.get_signed_vs_abs()


@router.get("/strategy-comparison", response_model=List[StrategyComparisonRecord])
async def get_strategy_comparison():
    """Get 3-Strategy Modeling Benchmark (Global vs Specific vs Calibrated) results."""
    return ArtifactService.get_strategy_comparison()


@router.get("/within-chemistry", response_model=List[BaselineResultRecord])
async def get_within_chemistry():
    """Get within-chemistry GroupKFold baseline benchmark results (B0-B4)."""
    res = ArtifactService.get_generic_artifact_records("within_chemistry_results")
    return [BaselineResultRecord(**r) for r in res["records"]]


@router.get("/loco-chemistry", response_model=List[BaselineResultRecord])
async def get_loco_chemistry():
    """Get Leave-One-Chemistry-Out multi-feature baseline benchmark results (B0-B4)."""
    res = ArtifactService.get_generic_artifact_records("loco_chemistry_results")
    return [BaselineResultRecord(target=r["target"], chemistry=r["test_chemistry"], baseline=r["baseline"], rmse=r["rmse"], r2=r["r2"]) for r in res["records"]]


@router.get("/sensitivity-study", response_model=List[SensitivityStudyRecord])
async def get_sensitivity_study():
    """Get polynomial detrending sensitivity study results (orders 1-6)."""
    res = ArtifactService.get_generic_artifact_records("sensitivity_study_results")
    return [SensitivityStudyRecord(**r) for r in res["records"]]


@router.get("/nmc-outliers", response_model=List[NmcOutlierRecord])
async def get_nmc_outliers():
    """Get Oxford NMC cell outlier diagnostic and operating temperature data."""
    res = ArtifactService.get_generic_artifact_records("nmc_outlier_summary")
    return [NmcOutlierRecord(**r) for r in res["records"]]


@router.get("/sign-reversal-summary", response_model=List[SignReversalPhysicsRecord])
async def get_sign_reversal_summary():
    """Get early vs. late SOH physical parameter deltas."""
    res = ArtifactService.get_generic_artifact_records("sign_reversal_physics_summary")
    return [SignReversalPhysicsRecord(**r) for r in res["records"]]


@router.get("/generic/{artifact_id}", response_model=GenericArtifactResponse)
async def get_generic_artifact(artifact_id: str):
    """Get records and metadata for any registered research artifact CSV."""
    try:
        data = ArtifactService.get_generic_artifact_records(artifact_id)
        return data
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Artifact with ID '{artifact_id}' not found.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/raw/{artifact_name}")
async def download_raw_artifact(artifact_name: str):
    """Download the raw CSV artifact file directly from disk."""
    try:
        file_path = ArtifactService.get_raw_csv_path(artifact_name)
        return FileResponse(
            path=str(file_path),
            filename=artifact_name,
            media_type="text/csv",
        )
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Artifact file '{artifact_name}' not found.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
