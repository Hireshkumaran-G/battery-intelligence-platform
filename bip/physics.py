# File: physics.py
# Relative Path: bip/physics.py
# Purpose: Provides core functionalities for the Physics Engine, including ripple decomposition, polynomial detrending, derivative analysis, and SNR computation, based on electrochemical principles.

import logging
from dataclasses import dataclass, field
from typing import Dict, Any, Tuple, Optional
import numpy as np
from scipy.signal import savgol_filter, find_peaks

from bip.config import ConfigManager, PhysicsConfig, SignalProcessingConfig

logger = logging.getLogger(__name__)


@dataclass
class PhysicsEngineResult:
    """Contains results from the physics engine computations."""
    processed_voltage: np.ndarray
    processed_current: np.ndarray
    processed_temperature: np.ndarray
    ripple_component: np.ndarray
    dqdv: Optional[np.ndarray] = None
    dvdt: Optional[np.ndarray] = None
    electrochemical_features: Dict[str, Any] = field(default_factory=dict)


class PhysicsEngine:
    """
    Simulates and processes battery physics data to extract core characteristics
    and advanced insights.
    """

    def __init__(self, config: Optional[PhysicsConfig] = None):
        """Initializes the PhysicsEngine with configuration settings."""
        if config:
            self.config = config
        else:
            try:
                self.config = ConfigManager.get_physics_config()
            except Exception as e:
                logger.error(f"Failed to load physics configuration: {e}")
                self.config = PhysicsConfig()

        # Load signal-processing config separately (for SG params)
        try:
            self.signal_config = ConfigManager.get_signal_processing_config()
        except Exception as e:
            logger.warning(f"Failed to load signal processing config in PhysicsEngine: {e}")
            self.signal_config = SignalProcessingConfig()

        logger.info("PhysicsEngine initialized with configuration.")

    def polynomial_detrend(self, signal: np.ndarray, order: Optional[int] = None) -> np.ndarray:
        """Detrends a signal using polynomial fitting."""
        p_order = order if order is not None else self.config.detrending_order
        if signal.size < p_order + 2:
            return signal.copy()

        x = np.arange(signal.size)
        coeffs = np.polyfit(x, signal, p_order)
        trend = np.polyval(coeffs, x)
        return signal - trend

    def _polynomial_detrend(self, signal: np.ndarray) -> np.ndarray:
        """Detrends a signal using polynomial fitting with config order."""
        return self.polynomial_detrend(signal, self.config.detrending_order)

    def _low_pass_filter(self, signal: np.ndarray, sampling_rate_hz: float) -> np.ndarray:
        """Applies a Savitzky-Golay low-pass filter."""
        window_size = int(self.signal_config.savitzky_golay_window)
        poly_order = int(self.signal_config.savitzky_golay_poly_order)

        if window_size % 2 == 0:
            window_size += 1

        if window_size < 3:
            window_size = 3

        if poly_order >= window_size:
            poly_order = max(1, window_size - 1)

        if signal.size < window_size:
            logger.warning("Signal too short for Savitzky-Golay filter. Returning original signal.")
            return signal

        return savgol_filter(signal, window_size, poly_order)

    def calculate_derivatives(self, signal: np.ndarray, window_size: Optional[int] = None) -> Tuple[np.ndarray, np.ndarray]:
        """Compute d1 and d2 derivatives with smoothing using Savitzky-Golay."""
        w_size = window_size if window_size is not None else self.config.derivative_window_size
        if w_size < 3 or w_size % 2 == 0:
            w_size = self.config.derivative_window_size
            if w_size < 3 or w_size % 2 == 0:
                w_size = 5

        if signal.size < w_size:
            nan_arr = np.full_like(signal, np.nan, dtype=float)
            return nan_arr, nan_arr

        from bip.signal import SignalProcessor
        d1 = SignalProcessor.savitzky_golay_filter(signal, window_length=w_size, poly_order=2, deriv=1, delta=1.0)
        d2 = SignalProcessor.savitzky_golay_filter(signal, window_length=w_size, poly_order=3, deriv=2, delta=1.0)

        # Mask edges with NaN as required by tests
        half = w_size // 2
        d1 = d1.astype(float)
        d2 = d2.astype(float)
        d1[:half] = np.nan
        d1[-half:] = np.nan
        d2[:half] = np.nan
        d2[-half:] = np.nan

        return d1, d2

    def _compute_derivatives(self, voltage: np.ndarray, current: np.ndarray, dt: float) -> Tuple[np.ndarray, np.ndarray]:
        """Compute dQ/dV and dV/dT derivatives with smoothing."""
        if voltage.size < self.config.derivative_window_size or current.size < self.config.derivative_window_size:
            logger.warning("Signal too short for derivative window. Returning zeros.")
            return np.zeros_like(voltage), np.zeros_like(voltage)

        smoothed_voltage = savgol_filter(voltage, self.config.derivative_window_size, self.config.derivative_poly_order)
        smoothed_current = savgol_filter(current, self.config.derivative_window_size, self.config.derivative_poly_order)

        dv = np.gradient(smoothed_voltage)
        dq = smoothed_current * dt
        dqdv = np.divide(dq, dv, out=np.zeros_like(dv), where=dv!=0)
        dvdt = np.gradient(smoothed_voltage, dt)

        return dqdv, dvdt

    def ripple_decomposition(self, signal: np.ndarray) -> np.ndarray:
        """Decomposes a signal into ripple and trend components."""
        return self._perform_ripple_decomposition(signal, 1.0)

    def _perform_ripple_decomposition(self, signal: np.ndarray, sampling_rate_hz: float) -> np.ndarray:
        """Decomposes a signal into ripple and trend components using configured method."""
        if self.config.ripple_decomposition_method == "polynomial_detrend":
            return self._polynomial_detrend(signal)
        elif self.config.ripple_decomposition_method == "moving_average":
            if signal.size < self.config.moving_average_window_size:
                logger.warning("Signal too short for moving average detrending. Returning zero-mean signal.")
                return signal - np.mean(signal)
            
            pad_size = self.config.moving_average_window_size // 2
            padded_signal = np.pad(signal, (pad_size, pad_size), mode='edge')
            weights = np.ones(self.config.moving_average_window_size) / self.config.moving_average_window_size
            trend = np.convolve(padded_signal, weights, mode='valid')
            return signal - trend
        else:
            logger.warning(
                f"Unsupported ripple decomposition method: {self.config.ripple_decomposition_method}. "
                "Returning original signal."
            )
            return signal.copy()

    def compute_snr(self, signal: np.ndarray, noise_estimate: Optional[np.ndarray] = None) -> float:
        """Evaluates Signal-to-Noise Ratio (SNR)."""
        if signal.size == 0:
            return float('-inf')
        
        if noise_estimate is not None:
            if noise_estimate.size != signal.size:
                raise ValueError("Noise estimate array must have the same length as the signal.")
            noise = noise_estimate
        else:
            noise = self.polynomial_detrend(signal, self.config.detrending_order)

        signal_power = np.mean(signal**2)
        noise_power = np.mean(noise**2)
        if noise_power == 0:
            if signal_power == 0:
                return float('-inf')
            return float('inf')
        return float(10 * np.log10(signal_power / noise_power))

    def _evaluate_snr(self, signal: np.ndarray, noise_component: np.ndarray) -> float:
        """Evaluates SNR (internal helper)."""
        return self.compute_snr(signal, noise_component)

    def electrochemical_interpretation(self, voltage: np.ndarray, current: np.ndarray, temperature: np.ndarray, time: np.ndarray) -> Dict[str, Any]:
        """Performs electrochemical interpretation, returning avg_abs_current and temp_std_dev."""
        if voltage.size == 0 or current.size == 0 or temperature.size == 0 or time.size == 0:
            return {}
        return {
            "avg_abs_current": float(np.mean(np.abs(current))),
            "temp_std_dev": float(np.std(temperature)),
        }

    def _electrochemical_modeling_placeholder(self, voltage: np.ndarray, current: np.ndarray, temperature: np.ndarray, dt: float) -> Dict[str, Any]:
        """Placeholder for advanced electrochemical modeling."""
        logger.info("Executing refined placeholder for electrochemical modeling.")
        ecm_features = {}
        
        if voltage.size < 2 or current.size < 2:
            logger.warning("Signals too short for electrochemical feature extraction. Skipping.")
            return ecm_features

        low_current_indices = np.where(np.abs(current) < 0.05)[0]
        if low_current_indices.size > 0:
            ocv_estimate = np.mean(voltage[low_current_indices])
        else:
            ocv_estimate = np.mean(voltage)
        ecm_features["ocv_estimate_v"] = float(ocv_estimate)

        avg_current = np.mean(current)
        avg_voltage = np.mean(voltage)
        if abs(avg_current) > 1e-3:
            effective_resistance_ohm = (avg_voltage - ocv_estimate) / avg_current
            ecm_features["effective_resistance_ohm"] = float(effective_resistance_ohm)
        else:
            ecm_features["effective_resistance_ohm"] = 0.0

        min_ocv_soc = 3.0
        max_ocv_soc = 4.2
        soc_from_ocv = (ocv_estimate - min_ocv_soc) / (max_ocv_soc - min_ocv_soc)
        ecm_features["soc_from_ocv_estimate"] = float(np.clip(soc_from_ocv, 0.0, 1.0))

        charge_ah = 0.0
        discharge_ah = 0.0
        charge_contributions = current[current > 0] * dt / 3600.0
        discharge_contributions = current[current < 0] * dt / 3600.0
        
        if charge_contributions.size > 0:
            charge_ah = np.sum(charge_contributions)
        if discharge_contributions.size > 0:
            discharge_ah = np.sum(np.abs(discharge_contributions))
        
        ecm_features["integrated_charge_ah"] = float(charge_ah)
        ecm_features["integrated_discharge_ah"] = float(discharge_ah)
        ecm_features["average_temperature_c"] = float(np.mean(temperature))
        ecm_features["temperature_range_c"] = float(np.ptp(temperature))
        ecm_features["diffusion_time_constant_s"] = 10.0

        return ecm_features

    def process_signals(
        self,
        voltage: np.ndarray,
        current: np.ndarray,
        temperature: np.ndarray,
        sampling_rate_hz: float,
    ) -> PhysicsEngineResult:
        """Performs signal processing, ripple decomposition, and derivative computations."""
        dt = 1.0 / sampling_rate_hz

        processed_voltage = self._low_pass_filter(voltage, sampling_rate_hz)
        processed_current = self._low_pass_filter(current, sampling_rate_hz)
        processed_temperature = self._low_pass_filter(temperature, sampling_rate_hz)

        ripple_component = self._perform_ripple_decomposition(processed_voltage, sampling_rate_hz)
        dqdv, dvdt = self._compute_derivatives(processed_voltage, processed_current, dt)
        
        electrochemical_features = {}
        if self.config.enable_electrochemical_models:
            electrochemical_features = self._electrochemical_modeling_placeholder(
                processed_voltage, processed_current, processed_temperature, dt
            )

        return PhysicsEngineResult(
            processed_voltage=processed_voltage,
            processed_current=processed_current,
            processed_temperature=processed_temperature,
            ripple_component=ripple_component,
            dqdv=dqdv,
            dvdt=dvdt,
            electrochemical_features=electrochemical_features
        )


__all__ = ["PhysicsEngine", "PhysicsEngineResult"]
