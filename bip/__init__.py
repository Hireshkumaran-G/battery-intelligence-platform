# File: __init__.py
# Relative Path: bip/__init__.py
# Purpose: Entry point for the Battery Intelligence Platform (BIP) package. Re-exports key classes for a simple and flat import structure.

from bip.config import (
    ConfigManager,
    GeneralConfig,
    PhysicsConfig,
    SignalProcessingConfig,
    FeaturesConfig,
    IntelligenceEngineConfig,
    DeploymentConfig,
    LoggingConfig,
)
from bip.store import (
    DatasetStore,
    DatasetArtifact,
    ExperimentRecord,
)
from bip.signal import (
    SignalProcessor,
    Peak,
)
from bip.physics import (
    PhysicsEngine,
    PhysicsEngineResult,
)
from bip.features import (
    FeatureEngineer,
    FeatureVector,
)
from bip.models import (
    BaseIntelligenceModel,
    ModelArtifact,
    ModelMetrics,
    ExplanationResult,
    Explainer,
    DecisionTreeConfig,
    DecisionTreeIntelligenceModel,
    PipelineConfig,
    IntelligencePipeline,
)
from bip.deploy import (
    STM32ModelExporter,
    STM32InferenceConfig,
)
from bip.validation import (
    ValidationFramework,
    ValidationConfig,
    ValidationResult,
)

__all__ = [
    "ConfigManager",
    "GeneralConfig",
    "PhysicsConfig",
    "SignalProcessingConfig",
    "FeaturesConfig",
    "IntelligenceEngineConfig",
    "DeploymentConfig",
    "LoggingConfig",
    "DatasetStore",
    "DatasetArtifact",
    "ExperimentRecord",
    "SignalProcessor",
    "Peak",
    "PhysicsEngine",
    "PhysicsEngineResult",
    "FeatureEngineer",
    "FeatureVector",
    "BaseIntelligenceModel",
    "ModelArtifact",
    "ModelMetrics",
    "ExplanationResult",
    "Explainer",
    "DecisionTreeConfig",
    "DecisionTreeIntelligenceModel",
    "PipelineConfig",
    "IntelligencePipeline",
    "STM32ModelExporter",
    "STM32InferenceConfig",
    "ValidationFramework",
    "ValidationConfig",
    "ValidationResult",
]
