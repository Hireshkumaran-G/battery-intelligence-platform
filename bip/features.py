# File: features.py
# Relative Path: bip/features.py
# Purpose: Produces ML-ready battery feature vector from processed signals without embedding any machine learning logic.

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List, Mapping, Optional, Sequence, Tuple

import numpy as np
from sklearn.base import BaseEstimator

from bip.signal import SignalProcessor
from bip.models import Explainer, ExplanationResult


@dataclass(frozen=True)
class FeatureVector:
    """Container for a named feature vector."""

    names: List[str]
    values: np.ndarray

    def as_dict(self) -> Dict[str, float]:
        """Return the feature vector as a name-to-value mapping."""
        return {name: float(value) for name, value in zip(self.names, self.values, strict=False)}


class FeatureEngineer:
    """Computes deterministic, ML-ready features from processed battery signals."""

    def __init__(self, feature_names: Optional[Sequence[str]] = None) -> None:
        """Initialize the feature engineer."""
        self.feature_names = list(feature_names) if feature_names is not None else []

    @staticmethod
    def _to_array(signal: Sequence[float] | np.ndarray) -> np.ndarray:
        """Convert input to a one-dimensional float array."""
        array = np.asarray(signal, dtype=float).reshape(-1)
        if array.size == 0:
            raise ValueError("Signal must not be empty.")
        return array

    @staticmethod
    def _safe_stat(value: float) -> float:
        """Convert non-finite values to zero for stable feature generation."""
        return float(value) if np.isfinite(value) else 0.0

    @staticmethod
    def _variance(x: np.ndarray) -> float:
        """Compute variance."""
        return float(np.var(x))

    @staticmethod
    def _skewness(x: np.ndarray) -> float:
        """Compute skewness using a pure NumPy formulation."""
        mean = np.mean(x)
        std = np.std(x)
        if std == 0:
            return 0.0
        centered = (x - mean) / std
        return float(np.mean(centered**3))

    @staticmethod
    def _kurtosis(x: np.ndarray) -> float:
        """Compute excess kurtosis using a pure NumPy formulation."""
        mean = np.mean(x)
        std = np.std(x)
        if std == 0:
            return 0.0
        centered = (x - mean) / std
        return float(np.mean(centered**4) - 3.0)

    @staticmethod
    def _entropy(x: np.ndarray, bins: int = 32) -> float:
        """Compute histogram-based Shannon entropy."""
        hist, _ = np.histogram(x, bins=bins, density=True)
        hist = hist[np.isfinite(hist)]
        hist = hist[hist > 0]
        if hist.size == 0:
            return 0.0
        p = hist / np.sum(hist)
        return float(-np.sum(p * np.log2(p)))

    @staticmethod
    def _crest_factor(x: np.ndarray) -> float:
        """Compute crest factor."""
        rms = np.sqrt(np.mean(x**2))
        if rms == 0:
            return 0.0
        return float(np.max(np.abs(x)) / rms)

    @staticmethod
    def _rms(x: np.ndarray) -> float:
        """Compute RMS."""
        return float(np.sqrt(np.mean(x**2)))

    @staticmethod
    def _ptp(x: np.ndarray) -> float:
        """Compute peak-to-peak value."""
        return float(np.ptp(x))

    @staticmethod
    def _rolling_stats(x: np.ndarray, window_size: int) -> Tuple[float, float]:
        """Compute rolling mean and rolling std over the last full window."""
        if window_size < 1:
            raise ValueError("window_size must be >= 1.")
        if x.size < window_size:
            return float(np.mean(x)), float(np.std(x))
        window = x[-window_size:]
        return float(np.mean(window)), float(np.std(window))

    @staticmethod
    def _frequency_features(x: np.ndarray, sampling_rate_hz: float) -> Dict[str, float]:
        """Compute frequency-domain battery features."""
        freqs, magnitudes, power = SignalProcessor.fft(x, sampling_rate_hz)
        if magnitudes.size == 0:
            return {
                "dominant_frequency": 0.0,
                "fft_energy": 0.0,
                "spectral_entropy": 0.0,
            }

        dominant_index = int(np.argmax(magnitudes))
        total_power = float(np.sum(power))
        if total_power <= 0:
            spectral_entropy = 0.0
        else:
            normalized_power = power / total_power
            normalized_power = normalized_power[normalized_power > 0]
            spectral_entropy = float(-np.sum(normalized_power * np.log2(normalized_power)))

        return {
            "dominant_frequency": float(freqs[dominant_index]),
            "fft_energy": total_power,
            "spectral_entropy": spectral_entropy,
        }

    @staticmethod
    def _ripple_features(ripple: np.ndarray, current: np.ndarray, voltage: np.ndarray) -> Dict[str, float]:
        """Compute ripple-centric features."""
        current_rms = float(np.sqrt(np.mean(current**2))) if current.size else 0.0
        voltage_rms = float(np.sqrt(np.mean(voltage**2))) if voltage.size else 0.0
        ripple_rms = float(np.sqrt(np.mean(ripple**2)))
        return {
            "ripple_rms": ripple_rms,
            "peak_ripple": float(np.max(np.abs(ripple))) if ripple.size else 0.0,
            "voltage_ripple": ripple_rms,
            "current_ripple": current_rms,
            "rms_current": current_rms,
            "rms_voltage": voltage_rms,
            "peak_to_peak_ripple": float(np.ptp(ripple)) if ripple.size else 0.0,
        }

    def compute_feature_vector(
        self,
        voltage: Sequence[float] | np.ndarray,
        current: Sequence[float] | np.ndarray,
        temperature: Sequence[float] | np.ndarray,
        sampling_rate_hz: float,
        ripple: Optional[Sequence[float] | np.ndarray] = None,
        charge_time_s: Optional[float] = None,
        window_size: int = 16,
        electrochemical_features: Optional[Dict[str, Any]] = None,
    ) -> FeatureVector:
        """Compute a complete, deterministic feature vector from processed signals."""
        v = self._to_array(voltage)
        i = self._to_array(current)
        t = self._to_array(temperature)

        if ripple is None:
            ripple_arr = v - np.mean(v)
        else:
            ripple_arr = self._to_array(ripple)

        freq_features = self._frequency_features(v, sampling_rate_hz)
        ripple_features = self._ripple_features(ripple_arr, i, v)

        features: Dict[str, float] = {
            "voltage_mean": self._safe_stat(float(np.mean(v))),
            "voltage_std": self._safe_stat(float(np.std(v))),
            "voltage_min": self._safe_stat(float(np.min(v))),
            "voltage_max": self._safe_stat(float(np.max(v))),
            "voltage_variance": self._safe_stat(self._variance(v)),
            "voltage_skewness": self._safe_stat(self._skewness(v)),
            "voltage_kurtosis": self._safe_stat(self._kurtosis(v)),
            "voltage_entropy": self._safe_stat(self._entropy(v)),
            "voltage_energy": self._safe_stat(float(np.sum(v**2))),
            "voltage_crest_factor": self._safe_stat(self._crest_factor(v)),
            "temperature_mean": self._safe_stat(float(np.mean(t))),
            "temperature_std": self._safe_stat(float(np.std(t))),
            "temperature_variance": self._safe_stat(self._variance(t)),
            "temperature_skewness": self._safe_stat(self._skewness(t)),
            "temperature_kurtosis": self._safe_stat(self._kurtosis(t)),
            "current_mean": self._safe_stat(float(np.mean(i))),
            "current_std": self._safe_stat(float(np.std(i))),
            "current_variance": self._safe_stat(self._variance(i)),
            "current_energy": self._safe_stat(float(np.sum(i**2))),
            "current_rms": self._safe_stat(float(np.sqrt(np.mean(i**2)))),
            "charge_time_s": self._safe_stat(float(charge_time_s)) if charge_time_s is not None else 0.0,
        }

        # Legacy Feature Engineering Parity Features
        v_interp = SignalProcessor.interpolate_signal(
            np.linspace(0.0, 1.0, len(v)),
            v,
            np.linspace(0.0, 1.0, 100),
            method="linear"
        )
        dv1 = np.diff(v_interp)
        dv2 = np.diff(dv1)

        def trapz_uniform(y, dx):
            if len(y) < 2:
                return 0.0
            return float(dx * (np.sum(y) - 0.5 * (y[0] + y[-1])))

        d1_ripple = trapz_uniform(np.abs(dv1), 1.0/99.0)
        d2_ripple = trapz_uniform(np.abs(dv2), 1.0/98.0)

        sig_pow = float(np.mean(v_interp**2))
        noise_pow = float(np.var(v_interp))
        snr_db = float(10.0 * np.log10(sig_pow / noise_pow)) if noise_pow > 0 and sig_pow > 0 else 0.0

        features.update({
            "D1_ripple": self._safe_stat(d1_ripple),
            "D2_ripple": self._safe_stat(d2_ripple),
            "snr_dB": self._safe_stat(snr_db),
            "v_mean": self._safe_stat(float(np.mean(v_interp))),
            "v_std": self._safe_stat(float(np.std(v_interp))),
            "v_min": self._safe_stat(float(np.min(v_interp))),
            "v_max": self._safe_stat(float(np.max(v_interp))),
            "tavg": self._safe_stat(float(np.mean(t))),
            "chargetime": self._safe_stat(float(charge_time_s) / 60.0) if charge_time_s is not None else 0.0,
        })

        features.update(freq_features)
        features.update(ripple_features)

        # Merge electrochemical features if available
        if electrochemical_features:
            for k, val in electrochemical_features.items():
                features[k] = self._safe_stat(float(val))

        rolling_mean_v, rolling_std_v = self._rolling_stats(v, window_size)
        rolling_mean_i, rolling_std_i = self._rolling_stats(i, window_size)
        rolling_mean_t, rolling_std_t = self._rolling_stats(t, window_size)

        features.update(
            {
                "rolling_voltage_mean": self._safe_stat(rolling_mean_v),
                "rolling_voltage_std": self._safe_stat(rolling_std_v),
                "rolling_current_mean": self._safe_stat(rolling_mean_i),
                "rolling_current_std": self._safe_stat(rolling_std_i),
                "rolling_temperature_mean": self._safe_stat(rolling_mean_t),
                "rolling_temperature_std": self._safe_stat(rolling_std_t),
            }
        )

        names = list(features.keys())
        values = np.asarray([features[name] for name in names], dtype=float)
        if self.feature_names:
            ordered_names = [name for name in self.feature_names if name in features]
            remaining = [name for name in names if name not in ordered_names]
            names = ordered_names + remaining
            values = np.asarray([features[name] for name in names], dtype=float)

        return FeatureVector(names=names, values=values)

    def compute_window_features(
        self,
        signal: Sequence[float] | np.ndarray,
        window_size: int,
        step_size: int,
    ) -> Dict[str, np.ndarray]:
        """Compute window-based statistical features for a single signal."""
        x = self._to_array(signal)
        windows = SignalProcessor.window_signal(x, window_size=window_size, step_size=step_size)

        return {
            "window_mean": np.mean(windows, axis=1),
            "window_std": np.std(windows, axis=1),
            "window_min": np.min(windows, axis=1),
            "window_max": np.max(windows, axis=1),
            "window_rms": np.sqrt(np.mean(windows**2, axis=1)),
            "window_energy": np.sum(windows**2, axis=1),
        }

    def select_features(
        self,
        feature_matrix: np.ndarray,
        feature_names: Sequence[str],
        selected_names: Sequence[str],
    ) -> Tuple[np.ndarray, List[str]]:
        """Select a subset of features by name."""
        matrix = np.asarray(feature_matrix, dtype=float)
        if matrix.ndim != 2:
            raise ValueError("feature_matrix must be two-dimensional.")

        name_to_index = {name: idx for idx, name in enumerate(feature_names)}
        actual_indices = []
        actual_selected_names = []
        for name in selected_names:
            if name in name_to_index:
                actual_indices.append(name_to_index[name])
                actual_selected_names.append(name)

        reduced = matrix[:, actual_indices]
        return reduced, actual_selected_names

    @staticmethod
    def rank_features_by_permutation_importance(
        model: BaseEstimator,
        X: np.ndarray,
        y: np.ndarray,
        feature_names: Sequence[str],
        n_repeats: int = 5,
        random_state: int = 42,
    ) -> ExplanationResult:
        """Ranks features by their permutation importance using the Explainer."""
        return Explainer.permutation_importance(
            model=model,
            X=X,
            y=y,
            feature_names=feature_names,
            n_repeats=n_repeats,
            random_state=random_state,
        )


__all__ = [
    "FeatureEngineer",
    "FeatureVector",
]
