# File: config.py
# Relative Path: bip/config.py
# Purpose: Provides a centralized, robust, and mutable mechanism for loading, validating, and accessing YAML-based configurations across the entire Battery Intelligence Platform (BIP).

import logging
import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional

import yaml

# Configure logging for the ConfigManager
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
# Prevent adding multiple handlers if already configured by the main application
if not logger.handlers:
    handler = logging.StreamHandler()
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    handler.setFormatter(formatter)
    logger.addHandler(handler)

# --- Configuration Dataclasses ---
# These dataclasses define the structure and default values for different
# sections of the BIP configuration. This provides type-safety and
# clear documentation for expected configuration parameters.

@dataclass
class GeneralConfig:
    """Configuration settings for general project parameters."""
    project_name: str = "Battery Intelligence Platform (BIP)"
    version: str = "2.1.0"
    base_data_path: Path = Path("data")
    log_level: str = "INFO"

@dataclass
class PhysicsConfig:
    """Configuration settings for the Physics Engine."""
    ripple_decomposition_method: str = "polynomial_detrend"
    detrending_order: int = 3
    moving_average_window_size: int = 10
    derivative_window_size: int = 5
    derivative_poly_order: int = 3
    snr_threshold: float = 10.0
    enable_electrochemical_models: bool = False

@dataclass
class SignalProcessingConfig:
    """Configuration settings for the Signal Processing Engine."""
    moving_average_window: int = 5
    savitzky_golay_window: int = 11
    savitzky_golay_poly_order: int = 3
    sampling_rate_hz: float = 1.0  # Example: 1 sample per second
    resample_target_hz: Optional[float] = None
    interpolation_method: str = "linear"
    fft_window_type: str = "hann"
    low_pass_cutoff_hz: float = 0.5
    high_pass_cutoff_hz: float = 0.01

@dataclass
class FeaturesConfig:
    """Configuration settings for the Feature Engineering Engine."""
    time_domain_features: List[str] = field(default_factory=list)
    frequency_domain_features: List[str] = field(default_factory=lambda: ["dominant_frequency", "fft_energy"])
    statistical_features: List[str] = field(default_factory=lambda: ["mean_voltage", "variance_current", "skewness_temp", "kurtosis_voltage"])
    ripple_features: List[str] = field(default_factory=lambda: ["ripple_rms", "d1_voltage", "d2_current", "snr_voltage"])
    window_sizes_seconds: List[int] = field(default_factory=lambda: [30, 60, 120])  # For rolling/windowed features
    enable_feature_selection: bool = False
    feature_selection_method: str = "permutation_importance"

@dataclass
class IntelligenceEngineConfig:
    """Configuration settings for the Intelligence Engine (models, training)."""
    model_type: str = "decision_tree"
    random_forest_n_estimators: int = 100
    random_forest_max_depth: int = 10
    svm_kernel: str = "rbf"
    svm_c: float = 1.0
    tiny_nn_layers: List[int] = field(default_factory=lambda: [64, 32])
    target_variable: str = "soh_class"  # e.g., 'soh_class' for classification, 'soh_value' for regression
    problem_type: str = "classification"  # or "regression"
    random_state: int = 42
    model_parameters: Dict[str, Any] = field(default_factory=dict)

@dataclass
class DeploymentConfig:
    """Configuration settings for the Deployment Engine."""
    target_platform: str = "stm32f446re"
    exporter_type: str = "emlearn"  # or "tensorflow_lite_micro"
    output_directory: Path = Path("firmware/exported_models")
    model_c_header_name: str = "bip_model.h"
    metadata_json_name: str = "bip_metadata.json"
    feature_order_json_name: str = "bip_feature_order.json"
    scaler_json_name: str = "bip_scaler.json"

@dataclass
class LoggingConfig:
    """Configuration settings for logging."""
    level: str = "INFO"  # DEBUG, INFO, WARNING, ERROR, CRITICAL
    file_path: Optional[Path] = None  # Path to log file, if None logs to console
    format: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    date_format: str = "%Y-%m-%d %H:%M:%S"

class ConfigManager:
    """
    Manages the loading, validation, and access of project configurations.
    Uses YAML files for configuration and dataclasses for type-safe access.
    """
    _instance: Optional['ConfigManager'] = None
    _config_data: Dict[str, Any] = {}
    _is_loaded: bool = False

    def __new__(cls) -> 'ConfigManager':
        if cls._instance is None:
            cls._instance = super(ConfigManager, cls).__new__(cls)
        return cls._instance

    @classmethod
    def load_config(cls, config_path: Path) -> None:
        """Loads the configuration from a specified YAML file."""
        if cls._is_loaded:
            logger.info(f"Configuration already loaded from {cls._config_data.get('__source_path__')}. Reloading from {config_path}.")
            cls._config_data = {}  # Clear existing config if reloading
            cls._is_loaded = False

        if not config_path.is_file():
            logger.error(f"Configuration file not found: {config_path}")
            raise FileNotFoundError(f"Configuration file not found: {config_path}")

        try:
            with open(config_path, 'r', encoding='utf-8') as f:
                cls._config_data = yaml.safe_load(f) or {}
            cls._config_data['__source_path__'] = str(config_path.absolute())
            cls._is_loaded = True
            logger.info(f"Configuration successfully loaded from: {config_path}")
        except yaml.YAMLError as e:
            logger.error(f"Error parsing YAML configuration file {config_path}: {e}")
            raise yaml.YAMLError(f"Error parsing YAML configuration file {config_path}: {e}")
        except Exception as e:
            logger.error(f"An unexpected error occurred while loading config {config_path}: {e}")
            raise

        cls._setup_global_logging()

    @classmethod
    def _setup_global_logging(cls) -> None:
        """Configures the root logger based on the loaded configuration."""
        log_config_dict = cls._config_data.get('logging', {})
        level_str = log_config_dict.get('level', 'INFO').upper()
        log_level = getattr(logging, level_str, logging.INFO)
        log_file_path = log_config_dict.get('file_path')
        log_format = log_config_dict.get('format', "%(asctime)s - %(name)s - %(levelname)s - %(message)s")
        date_format = log_config_dict.get('date_format', "%Y-%m-%d %H:%M:%S")

        root_logger = logging.getLogger()
        root_logger.setLevel(log_level)

        for handler in root_logger.handlers[:]:
            root_logger.removeHandler(handler)

        formatter = logging.Formatter(log_format, datefmt=date_format)

        console_handler = logging.StreamHandler()
        console_handler.setFormatter(formatter)
        root_logger.addHandler(console_handler)

        if log_file_path:
            try:
                log_dir = Path(log_file_path).parent
                log_dir.mkdir(parents=True, exist_ok=True)
                file_handler = logging.FileHandler(log_file_path, encoding='utf-8')
                file_handler.setFormatter(formatter)
                root_logger.addHandler(file_handler)
                logger.info(f"Logging also configured to file: {log_file_path}")
            except Exception as e:
                logger.error(f"Could not set up file logging to {log_file_path}: {e}")

    @classmethod
    def _get_section_data(cls, section_name: str) -> Dict[str, Any]:
        """Helper to get a specific section's data, raising an error if not found."""
        if not cls._is_loaded:
            raise RuntimeError("Configuration not loaded. Call load_config() first.")
        section_data = cls._config_data.get(section_name)
        if section_data is None:
            logger.warning(f"Configuration section '{section_name}' not found. Using default dataclass values.")
            return {}
        return section_data

    @classmethod
    def get_general_config(cls) -> GeneralConfig:
        """Retrieves the GeneralConfig dataclass instance."""
        data = cls._get_section_data('general')
        return GeneralConfig(**data)

    @classmethod
    def get_physics_config(cls) -> PhysicsConfig:
        """Retrieves the PhysicsConfig dataclass instance."""
        data = cls._get_section_data('physics')
        return PhysicsConfig(**data)

    @classmethod
    def get_signal_processing_config(cls) -> SignalProcessingConfig:
        """Retrieves the SignalProcessingConfig dataclass instance."""
        data = cls._get_section_data('signal_processing')
        return SignalProcessingConfig(**data)

    @classmethod
    def get_features_config(cls) -> FeaturesConfig:
        """Retrieves the FeaturesConfig dataclass instance."""
        data = cls._get_section_data('features')
        return FeaturesConfig(**data)

    @classmethod
    def get_intelligence_engine_config(cls) -> IntelligenceEngineConfig:
        """Retrieves the IntelligenceEngineConfig dataclass instance."""
        data = cls._get_section_data('intelligence_engine')
        # Map parameters safely
        return IntelligenceEngineConfig(**data)

    @classmethod
    def get_deployment_config(cls) -> DeploymentConfig:
        """Retrieves the DeploymentConfig dataclass instance."""
        data = cls._get_section_data('deployment')
        return DeploymentConfig(**data)

    @classmethod
    def get_logging_config(cls) -> LoggingConfig:
        """Retrieves the LoggingConfig dataclass instance."""
        data = cls._get_section_data('logging')
        return LoggingConfig(**data)

    @classmethod
    def get_raw_config(cls) -> Dict[str, Any]:
        """Retrieves the entire raw loaded configuration dictionary."""
        if not cls._is_loaded:
            raise RuntimeError("Configuration not loaded. Call load_config() first.")
        return cls._config_data

    @classmethod
    def is_loaded(cls) -> bool:
        """Checks if a configuration has been loaded."""
        return cls._is_loaded
