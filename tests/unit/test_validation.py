import numpy as np
import pytest
from sklearn.linear_model import LinearRegression, LogisticRegression

from bip import ValidationFramework, ValidationConfig

@pytest.fixture
def regression_data():
    """Mock dataset for regression validation tests."""
    np.random.seed(42)
    X = np.random.randn(20, 3)
    y = X[:, 0] * 1.5 + X[:, 1] * -0.8 + np.random.randn(20) * 0.1
    return X, y

@pytest.fixture
def classification_data():
    """Mock dataset with policy groups for classification validation tests."""
    np.random.seed(42)
    X = np.random.randn(30, 2)
    # Binary classification target
    y = (X[:, 0] + X[:, 1] > 0).astype(int)
    # Groups: 3 distinct policy groups
    groups = ["Policy_A"] * 10 + ["Policy_B"] * 10 + ["Policy_C"] * 10
    return X, y, groups

@pytest.mark.unit
def test_kfold_regression_validation(regression_data):
    """Test standard K-Fold validation on regression target."""
    X, y = regression_data
    config = ValidationConfig(
        n_splits=3,
        shuffle=True,
        random_state=42,
        metrics=["rmse", "mae", "r2"]
    )
    val_framework = ValidationFramework(config=config)
    
    def model_constructor():
        return LinearRegression()
        
    result = val_framework.run_kfold_validation(
        model_constructor=model_constructor,
        X=X,
        y=y,
        scaler=True,
        experiment_name="test_kfold_regression"
    )
    
    assert "rmse" in result.average_metrics
    assert "mae" in result.average_metrics
    assert "r2" in result.average_metrics
    assert len(result.fold_metrics) == 3
    assert result.y_true_all.shape == (20,)
    assert result.y_pred_all.shape == (20,)

@pytest.mark.unit
def test_loco_classification_validation(classification_data):
    """Test LOCO-CV validation on classification target with group splits."""
    X, y, groups = classification_data
    config = ValidationConfig(
        metrics=["accuracy", "precision", "recall", "f1"]
    )
    val_framework = ValidationFramework(config=config)
    
    def model_constructor():
        return LogisticRegression()
        
    result = val_framework.run_loco_validation(
        model_constructor=model_constructor,
        X=X,
        y=y,
        groups=groups,
        scaler=True,
        experiment_name="test_loco_classification"
    )
    
    assert "accuracy" in result.average_metrics
    assert "f1" in result.average_metrics
    assert len(result.fold_metrics) == 3 # 3 unique groups = 3 folds
    assert result.y_true_all.shape == (30,)
    assert result.y_pred_all.shape == (30,)
