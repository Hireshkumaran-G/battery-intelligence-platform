from fastapi import APIRouter
from bip_api.schemas.deployment import DeploymentSummaryResponse
from bip_api.services.deployment_service import DeploymentService

router = APIRouter(prefix="/deployment", tags=["Embedded Deployment"])


@router.get("/summary", response_model=DeploymentSummaryResponse)
async def get_deployment_summary():
    """Get status and metadata for all exported STM32 embedded C models."""
    return DeploymentService.get_summary()
