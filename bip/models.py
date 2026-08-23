# File: models.py
# Relative Path: bip/models.py
# Purpose: Consolidates the intelligence pipeline, explainability utilities, and model implementations (including Decision Tree) under a single module.

from __future__ import annotations

import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Literal, Optional, Sequence, Union

import numpy as np
import joblib
from sklearn.tree import DecisionTreeClassifier, DecisionTreeRegressor, export_text
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, mean_squared_error, r2_score
from sklearn.base import BaseEstimator

logger = logging.getLogger(__name__)


# =====================================================================
# --- Base Model Definitions ---
# =====================================================================

@dataclass(frozen=True)
class ModelMetrics:
    """Standard metrics container for intelligence modules."""
    accuracy: Optional[float] = None
    precision: Optional[float] = None
    recall: Optional[float] = None
    f1_score: Optional[float] = None
    roc_auc: Optional[float] = None
    pr_auc: Optional[float] = None
    training_time_s: Optional[float] = None
    inference_time_ms: Optional[float] = None
    memory_usage_bytes: Optional[int] = None
    flash_usage_bytes: Optional[int] = None
    model_size_bytes: Optional[int] = None
    mse: Optional[float] = None  # Added for regression compatibility
    r2: Optional[float] = None   # Added for regression compatibility
    extra: Dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class ModelArtifact:
    """Serializable model artifact metadata."""
    model_id: str
    model_type: str
    version: str
    artifact_path: str
    metadata: Dict[str, Any] = field(default_factory=dict)


class BaseIntelligenceModel(ABC):
    """Abstract contract for every intelligence module in BIP."""

    @abstractmethod
    def train(self, features: np.ndarray, labels: np.ndarray, **kwargs: Any) -> "BaseIntelligenceModel":
        """Train the model and return the fitted instance."""

    @abstractmethod
    def predict(self, features: np.ndarray, **kwargs: Any) -> np.ndarray:
        """Generate predictions for the given feature matrix."""

    @abstractmethod
    def evaluate(self, features: np.ndarray, labels: np.ndarray, **kwargs: Any) -> ModelMetrics:
        """Evaluate the model and return standard metrics."""

    @abstractmethod
    def benchmark(self, features: np.ndarray, labels: np.ndarray, **kwargs: Any) -> ModelMetrics:
        """Benchmark the model for accuracy and resource usage."""

    @abstractmethod
    def save(self, path: str | Path, **kwargs: Any) -> Path:
        """Persist the trained model to disk."""

    @classmethod
    @abstractmethod
    def load(cls, path: str | Path, **kwargs: Any) -> "BaseIntelligenceModel":
        """Load a trained model from disk."""

    @abstractmethod
    def export(self, output_dir: str | Path, **kwargs: Any) -> Dict[str, Path]:
        """Export deployment-ready artifacts."""

    @abstractmethod
    def explain(self, features: np.ndarray, **kwargs: Any) -> Dict[str, Any]:
        """Return explainability outputs for model decisions."""


# =====================================================================
# --- Explainability Utilities ---
# =====================================================================

@dataclass(frozen=True)
class ExplanationResult:
    """Structured explanation output for a fitted model."""
    method: str
    feature_names: List[str]
    scores: Dict[str, float] = field(default_factory=dict)
    extra: Dict[str, Any] = field(default_factory=dict)


class Explainer:
    """Model explainability utilities for BIP."""

    @staticmethod
    def _to_numpy(X: Sequence[Sequence[float]] | np.ndarray) -> np.ndarray:
        array = np.asarray(X, dtype=float)
        if array.ndim != 2:
            raise ValueError("X must be a 2D feature matrix.")
        return array

    @staticmethod
    def _feature_names(feature_names: Optional[Sequence[str]], n_features: int) -> List[str]:
        if feature_names is None:
            return [f"feature_{i}" for i in range(n_features)]
        names = list(feature_names)
        if len(names) != n_features:
            raise ValueError("feature_names length must match the number of features.")
        return names

    @staticmethod
    def feature_importance(model: Any, feature_names: Optional[Sequence[str]] = None) -> ExplanationResult:
        """Return model-native feature importances when available."""
        importances = getattr(model, "feature_importances_", None)
        if importances is None and hasattr(model, "model") and hasattr(model.model, "feature_importances_"):
            importances = model.model.feature_importances_
        if importances is None:
            raise ValueError("Model does not expose feature_importances_.")

        importances_arr = np.asarray(importances, dtype=float).reshape(-1)
        names = Explainer._feature_names(feature_names, importances_arr.size)
        scores = {name: float(score) for name, score in zip(names, importances_arr, strict=False)}

        return ExplanationResult(
            method="feature_importance",
            feature_names=names,
            scores=scores,
        )

    @staticmethod
    def permutation_importance(
        model: Any,
        X: Sequence[Sequence[float]] | np.ndarray,
        y: Sequence[Any] | np.ndarray,
        feature_names: Optional[Sequence[str]] = None,
        n_repeats: int = 5,
        random_state: int = 42,
    ) -> ExplanationResult:
        """Compute permutation importance with scikit-learn when available."""
        X_arr = Explainer._to_numpy(X)
        y_arr = np.asarray(y).reshape(-1)
        names = Explainer._feature_names(feature_names, X_arr.shape[1])

        try:
            from sklearn.inspection import permutation_importance

            # Unwrap model if it's a BaseIntelligenceModel wrapper
            fit_model = model.model if hasattr(model, "model") else model

            result = permutation_importance(
                fit_model,
                X_arr,
                y_arr,
                n_repeats=n_repeats,
                random_state=random_state,
            )
            scores = {
                name: float(importance)
                for name, importance in zip(names, result.importances_mean, strict=False)
            }
            extra = {
                "importances_std": {
                    name: float(std)
                    for name, std in zip(names, result.importances_std, strict=False)
                },
                "baseline_score": float(result.importances_mean.mean()),
            }
            return ExplanationResult(
                method="permutation_importance",
                feature_names=names,
                scores=scores,
                extra=extra,
            )
        except Exception:
            fit_model = model.model if hasattr(model, "model") else model
            baseline = float(fit_model.score(X_arr, y_arr)) if hasattr(fit_model, "score") else 0.0
            scores = {name: 0.0 for name in names}
            return ExplanationResult(
                method="permutation_importance_fallback",
                feature_names=names,
                scores=scores,
                extra={"baseline_score": baseline},
            )

    @staticmethod
    def shap_values(
        model: Any,
        X: Sequence[Sequence[float]] | np.ndarray,
        feature_names: Optional[Sequence[str]] = None,
    ) -> ExplanationResult:
        """Return SHAP values when the shap package is available."""
        X_arr = Explainer._to_numpy(X)
        names = Explainer._feature_names(feature_names, X_arr.shape[1])

        try:
            import shap  # type: ignore
            fit_model = model.model if hasattr(model, "model") else model
            explainer = shap.Explainer(fit_model, X_arr)
            values = explainer(X_arr)

            if hasattr(values, "values"):
                raw = np.asarray(values.values)
            else:
                raw = np.asarray(values)

            mean_abs = np.mean(np.abs(raw), axis=0)
            scores = {name: float(score) for name, score in zip(names, mean_abs, strict=False)}

            return ExplanationResult(
                method="shap",
                feature_names=names,
                scores=scores,
                extra={"shape": list(raw.shape)},
            )
        except Exception:
            return ExplanationResult(
                method="shap_unavailable",
                feature_names=names,
                scores={name: 0.0 for name in names},
                extra={},
            )

    @staticmethod
    def local_linear_effect(
        model: Any,
        sample: Sequence[float] | np.ndarray,
        feature_names: Optional[Sequence[str]] = None,
        epsilon: float = 1e-4,
    ) -> ExplanationResult:
        """Approximate local sensitivity by finite differences."""
        x = np.asarray(sample, dtype=float).reshape(-1)
        names = Explainer._feature_names(feature_names, x.size)

        fit_model = model.model if hasattr(model, "model") else model
        if not hasattr(fit_model, "predict"):
            raise ValueError("Model must implement predict().")

        base = np.asarray(fit_model.predict(x.reshape(1, -1))).reshape(-1)
        scores: Dict[str, float] = {}

        for idx, name in enumerate(names):
            perturbed = x.copy()
            perturbed[idx] += epsilon
            changed = np.asarray(fit_model.predict(perturbed.reshape(1, -1))).reshape(-1)
            scores[name] = float(np.mean(np.abs(changed - base)) / epsilon)

        return ExplanationResult(
            method="local_linear_effect",
            feature_names=names,
            scores=scores,
            extra={"baseline_prediction": base.tolist()},
        )


# =====================================================================
# --- Decision Tree Model ---
# =====================================================================

@dataclass
class DecisionTreeConfig:
    """Configuration for a Decision Tree model."""
    problem_type: Literal["classification", "regression"] = "classification"
    max_depth: Optional[int] = None
    random_state: Optional[int] = 42
    min_samples_leaf: int = 1
    class_weight: Optional[Union[str, Dict[int, float]]] = "balanced"


class DecisionTreeIntelligenceModel(BaseIntelligenceModel):
    """Implementation of the BaseIntelligenceModel for Decision Tree algorithms."""

    def __init__(self, config: Optional[DecisionTreeConfig] = None) -> None:
        self.config = config or DecisionTreeConfig()
        logger.info(f"Initializing DecisionTreeIntelligenceModel with config: {self.config}")

        if self.config.problem_type == "classification":
            self.model = DecisionTreeClassifier(
                max_depth=self.config.max_depth,
                random_state=self.config.random_state,
                min_samples_leaf=self.config.min_samples_leaf,
                class_weight=self.config.class_weight,
            )
        elif self.config.problem_type == "regression":
            self.model = DecisionTreeRegressor(
                max_depth=self.config.max_depth,
                random_state=self.config.random_state,
                min_samples_leaf=self.config.min_samples_leaf
            )
        else:
            raise ValueError(f"Unsupported problem type: {self.config.problem_type}")

        self.is_fitted = False

    def train(self, features: np.ndarray, labels: np.ndarray, **kwargs: Any) -> "DecisionTreeIntelligenceModel":
        self.model.fit(features, labels)
        self.is_fitted = True
        return self

    def predict(self, features: np.ndarray, **kwargs: Any) -> np.ndarray:
        if not self.is_fitted:
            raise RuntimeError("Model is not fitted.")
        return self.model.predict(features)

    def evaluate(self, features: np.ndarray, labels: np.ndarray, **kwargs: Any) -> ModelMetrics:
        predictions = self.predict(features)
        if self.config.problem_type == "regression":
            return ModelMetrics(
                mse=float(mean_squared_error(labels, predictions)),
                r2=float(r2_score(labels, predictions))
            )

        return ModelMetrics(
            accuracy=float(accuracy_score(labels, predictions)),
            precision=float(precision_score(labels, predictions, average="weighted", zero_division=0)),
            recall=float(recall_score(labels, predictions, average="weighted", zero_division=0)),
            f1_score=float(f1_score(labels, predictions, average="weighted", zero_division=0)),
        )

    def benchmark(self, features: np.ndarray, labels: np.ndarray, **kwargs: Any) -> ModelMetrics:
        metrics = self.evaluate(features, labels)
        if self.model is not None:
            metrics.extra["model_depth"] = int(self.model.get_depth())
            metrics.extra["model_leaves"] = int(self.model.get_n_leaves())
        return metrics

    def save(self, path: str | Path, **kwargs: Any) -> Path:
        if not self.is_fitted:
            raise RuntimeError("Model is not fitted.")
        output_path = Path(path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump({"model": self.model, "config": self.config, "is_fitted": self.is_fitted}, output_path)
        return output_path

    @classmethod
    def load(cls, path: str | Path, **kwargs: Any) -> "DecisionTreeIntelligenceModel":
        payload = joblib.load(Path(path))
        instance = cls(config=payload["config"])
        instance.model = payload["model"]
        instance.is_fitted = payload.get("is_fitted", True)
        return instance

    def export(self, output_dir: str | Path, **kwargs: Any) -> Dict[str, Path]:
        if not self.is_fitted or self.model is None:
            raise RuntimeError("Model is not fitted.")
        out_dir = Path(output_dir)
        out_dir.mkdir(parents=True, exist_ok=True)

        model_path = out_dir / "decision_tree_model.joblib"
        text_path = out_dir / "decision_tree_rules.txt"

        joblib.dump(self.model, model_path)
        text_path.write_text(export_text(self.model), encoding="utf-8")

        return {"model": model_path, "rules": text_path}

    def explain(self, features: np.ndarray, **kwargs: Any) -> Dict[str, Any]:
        if not self.is_fitted or self.model is None:
            raise RuntimeError("Model is not fitted.")

        result: Dict[str, Any] = {
            "feature_importances": getattr(self.model, "feature_importances_", None),
            "tree_depth": int(self.model.get_depth()),
            "tree_leaves": int(self.model.get_n_leaves()),
        }
        if features.size:
            result["sample_count"] = int(features.shape[0])
        return result


# =====================================================================
# --- Intelligence Pipeline ---
# =====================================================================

@dataclass
class PipelineConfig:
    """Configuration for the intelligence pipeline."""
    model_type: str = "decision_tree"
    problem_type: str = "classification"
    feature_names: Optional[Sequence[str]] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    model_parameters: Dict[str, Any] = field(default_factory=dict)


class IntelligencePipeline:
    """End-to-end intelligence workflow for training, evaluation, and explanation."""

    def __init__(self, config: Optional[PipelineConfig] = None) -> None:
        self.config = config or PipelineConfig()
        self.model: BaseIntelligenceModel = self._build_model()

    def _build_model(self) -> BaseIntelligenceModel:
        if self.config.model_type == "decision_tree":
            return DecisionTreeIntelligenceModel(
                DecisionTreeConfig(
                    problem_type=self.config.problem_type,
                    **self.config.model_parameters,
                )
            )
        raise ValueError(f"Unsupported model_type: {self.config.model_type}")

    def train(self, features: np.ndarray, labels: np.ndarray) -> "IntelligencePipeline":
        self.model.train(features, labels)
        return self

    def predict(self, features: np.ndarray) -> np.ndarray:
        return self.model.predict(features)

    def evaluate(self, features: np.ndarray, labels: np.ndarray) -> ModelMetrics:
        return self.model.evaluate(features, labels)

    def benchmark(self, features: np.ndarray, labels: np.ndarray) -> ModelMetrics:
        return self.model.benchmark(features, labels)

    def explain(self, features: np.ndarray) -> ExplanationResult:
        return Explainer.feature_importance(
            self.model,
            feature_names=self.config.feature_names,
        )

    def save(self, path: str | Path) -> Path:
        return self.model.save(path)

    @classmethod
    def load(cls, path: str | Path, config: Optional[PipelineConfig] = None) -> "IntelligencePipeline":
        pipeline = cls(config=config)
        pipeline.model = DecisionTreeIntelligenceModel.load(path)
        return pipeline


__all__ = [
    "BaseIntelligenceModel",
    "ModelArtifact",
    "ModelMetrics",
    "ExplanationResult",
    "Explainer",
    "DecisionTreeConfig",
    "DecisionTreeIntelligenceModel",
    "PipelineConfig",
    "IntelligencePipeline",
]
