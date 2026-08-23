# File: validation.py
# Relative Path: bip/validation.py
# Purpose: Provides validation utilities (such as cross validation) for model evaluation.

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Any, Dict, List, Callable, Optional

import numpy as np
from sklearn.model_selection import KFold, LeaveOneGroupOut
from sklearn.metrics import (
    mean_squared_error,
    mean_absolute_error,
    r2_score,
    mean_absolute_percentage_error,
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
)
from sklearn.base import BaseEstimator
from sklearn.preprocessing import StandardScaler

logger = logging.getLogger(__name__)


@dataclass
class ValidationConfig:
    n_splits: int = 5
    shuffle: bool = True
    random_state: int = 42
    metrics: List[str] = field(default_factory=lambda: ["rmse", "mae", "r2", "mape"])


@dataclass
class ValidationResult:
    config: ValidationConfig
    average_metrics: Dict[str, float]
    std_metrics: Dict[str, float]
    fold_metrics: List[Dict[str, float]]
    y_true_all: np.ndarray
    y_pred_all: np.ndarray


class ValidationFramework:
    def __init__(self, config: Optional[ValidationConfig] = None):
        self.config = config or ValidationConfig()
        self.metrics_map: Dict[str, Callable] = {
            "mse": mean_squared_error,
            "rmse": lambda y_true, y_pred: np.sqrt(mean_squared_error(y_true, y_pred)),
            "mae": mean_absolute_error,
            "r2": r2_score,
            "mape": mean_absolute_percentage_error,
            "accuracy": accuracy_score,
            "precision": lambda y_true, y_pred: precision_score(y_true, y_pred, zero_division=0),
            "recall": lambda y_true, y_pred: recall_score(y_true, y_pred, zero_division=0),
            "f1": lambda y_true, y_pred: f1_score(y_true, y_pred, zero_division=0),
        }

    def _calculate_metrics(self, y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, float]:
        calculated_metrics = {}
        for metric_name in self.config.metrics:
            if metric_name in self.metrics_map:
                try:
                    calculated_metrics[metric_name] = self.metrics_map[metric_name](y_true, y_pred)
                except Exception as e:
                    logger.warning(f"Could not calculate metric {metric_name}: {e}")
                    calculated_metrics[metric_name] = np.nan
            else:
                logger.warning(f"Unknown metric requested: {metric_name}")
                calculated_metrics[metric_name] = np.nan
        return calculated_metrics

    def run_kfold_validation(
        self,
        model_constructor: Callable[[], BaseEstimator],
        X: np.ndarray,
        y: np.ndarray,
        scaler: Optional[StandardScaler] = None,
        experiment_name: str = "kfold_validation"
    ) -> ValidationResult:
        logger.info(f"Starting K-Fold Validation for experiment: {experiment_name}")
        kf = KFold(n_splits=self.config.n_splits, shuffle=self.config.shuffle, random_state=self.config.random_state)

        fold_metrics: List[Dict[str, float]] = []
        y_true_all: List[np.ndarray] = []
        y_pred_all: List[np.ndarray] = []

        for fold_idx, (train_index, test_index) in enumerate(kf.split(X)):
            logger.info(f"Processing Fold {fold_idx + 1}/{self.config.n_splits}")
            X_train, X_test = X[train_index], X[test_index]
            y_train, y_test = y[train_index], y[test_index]

            # Scale features if a scaler is provided
            if scaler:
                current_scaler = StandardScaler()
                X_train_scaled = current_scaler.fit_transform(X_train)
                X_test_scaled = current_scaler.transform(X_test)
            else:
                X_train_scaled = X_train
                X_test_scaled = X_test

            model = model_constructor()
            model.fit(X_train_scaled, y_train)
            y_pred = model.predict(X_test_scaled)

            fold_met = self._calculate_metrics(y_test, y_pred)
            fold_metrics.append(fold_met)
            y_true_all.append(y_test)
            y_pred_all.append(y_pred)

            logger.info(f"Fold {fold_idx + 1} metrics: {fold_met}")

        avg_metrics: Dict[str, float] = {
            metric: float(np.mean([f[metric] for f in fold_metrics if metric in f]))
            for metric in self.config.metrics
        }
        std_metrics: Dict[str, float] = {
            metric: float(np.std([f[metric] for f in fold_metrics if metric in f]))
            for metric in self.config.metrics
        }

        logger.info(f"K-Fold Validation Complete. Average metrics: {avg_metrics}")

        return ValidationResult(
            config=self.config,
            average_metrics=avg_metrics,
            std_metrics=std_metrics,
            fold_metrics=fold_metrics,
            y_true_all=np.concatenate(y_true_all) if y_true_all else np.array([]),
            y_pred_all=np.concatenate(y_pred_all) if y_pred_all else np.array([])
        )

    def run_loco_validation(
        self,
        model_constructor: Callable[[], BaseEstimator],
        X: np.ndarray,
        y: np.ndarray,
        groups: np.ndarray | List[Any],
        scaler: Optional[StandardScaler] = None,
        experiment_name: str = "loco_validation"
    ) -> ValidationResult:
        logger.info(f"Starting LOCO Validation for experiment: {experiment_name}")
        logo = LeaveOneGroupOut()
        groups_arr = np.asarray(groups)

        fold_metrics: List[Dict[str, float]] = []
        y_true_all: List[np.ndarray] = []
        y_pred_all: List[np.ndarray] = []

        for fold_idx, (train_index, test_index) in enumerate(logo.split(X, y, groups=groups_arr)):
            logger.info(f"Processing Fold {fold_idx + 1} for LOCO-CV")
            X_train, X_test = X[train_index], X[test_index]
            y_train, y_test = y[train_index], y[test_index]

            if scaler:
                current_scaler = StandardScaler()
                X_train_scaled = current_scaler.fit_transform(X_train)
                X_test_scaled = current_scaler.transform(X_test)
            else:
                X_train_scaled = X_train
                X_test_scaled = X_test

            model = model_constructor()
            model.fit(X_train_scaled, y_train)
            y_pred = model.predict(X_test_scaled)

            fold_met = self._calculate_metrics(y_test, y_pred)
            fold_metrics.append(fold_met)
            y_true_all.append(y_test)
            y_pred_all.append(y_pred)

            logger.info(f"Fold {fold_idx + 1} metrics: {fold_met}")

        avg_metrics: Dict[str, float] = {
            metric: float(np.mean([f[metric] for f in fold_metrics if metric in f]))
            for metric in self.config.metrics
        }
        std_metrics: Dict[str, float] = {
            metric: float(np.std([f[metric] for f in fold_metrics if metric in f]))
            for metric in self.config.metrics
        }

        logger.info(f"LOCO Validation Complete. Average metrics: {avg_metrics}")

        return ValidationResult(
            config=self.config,
            average_metrics=avg_metrics,
            std_metrics=std_metrics,
            fold_metrics=fold_metrics,
            y_true_all=np.concatenate(y_true_all) if y_true_all else np.array([]),
            y_pred_all=np.concatenate(y_pred_all) if y_pred_all else np.array([])
        )


__all__ = ["ValidationFramework", "ValidationConfig", "ValidationResult"]
