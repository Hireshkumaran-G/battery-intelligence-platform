# File: signal.py
# Relative Path: bip/signal.py
# Purpose: Provides a reusable digital signal processing library for the Battery Intelligence Platform (BIP), including filtering, FFT, interpolation, resampling, normalization, peak detection, and a lightweight wavelet interface.

from __future__ import annotations

import logging
from dataclasses import dataclass
import numpy as np
from scipy.signal import butter, filtfilt
from typing import Literal, Optional, Sequence, Tuple

from bip.config import ConfigManager, SignalProcessingConfig

logger = logging.getLogger(__name__)

ArrayLike = Sequence[float] | np.ndarray


@dataclass(frozen=True)
class Peak:
    """Dataclass representing a detected peak."""
    index: int
    value: float
    prominence: float


class SignalProcessor:
    """Provides common signal processing utilities."""

    def __init__(self, config: Optional[SignalProcessingConfig] = None):
        """Initializes the SignalProcessor with configuration settings."""
        if config:
            self.config = config
        else:
            try:
                self.config = ConfigManager.get_signal_processing_config()
            except Exception as e:
                logger.error(f"Failed to load signal processing configuration: {e}")
                self.config = SignalProcessingConfig() # Fallback to default

    @staticmethod
    def _to_1d_array(signal: ArrayLike) -> np.ndarray:
        """Convert input to a contiguous one-dimensional float array."""
        array = np.asarray(signal, dtype=float).reshape(-1)
        if array.size == 0:
            raise ValueError("Signal must not be empty.")
        return array

    @staticmethod
    def moving_average(signal: ArrayLike, window_size: int) -> np.ndarray:
        """Compute a centered moving average using a uniform kernel."""
        if window_size < 1:
            raise ValueError("window_size must be >= 1.")
        x = SignalProcessor._to_1d_array(signal)
        if window_size == 1:
            return x.copy()
        kernel = np.ones(window_size, dtype=float) / window_size
        return np.convolve(x, kernel, mode="same")

    @staticmethod
    def polynomial_fit(signal: ArrayLike, order: int) -> Tuple[np.ndarray, np.ndarray]:
        """Fit a polynomial trend and return the trend and residual."""
        if order < 0:
            raise ValueError("order must be >= 0.")
        x = SignalProcessor._to_1d_array(signal)
        if x.size <= order:
            raise ValueError("Signal length must be greater than polynomial order.")
        t = np.arange(x.size, dtype=float)
        coeffs = np.polyfit(t, x, order)
        trend = np.polyval(coeffs, t)
        residual = x - trend
        return trend, residual

    @staticmethod
    def savitzky_golay_filter(
        signal: ArrayLike,
        window_length: int,
        poly_order: int,
        deriv: int = 0,
        delta: float = 1.0,
    ) -> np.ndarray:
        """Apply a Savitzky-Golay filter using a pure NumPy implementation."""
        x = SignalProcessor._to_1d_array(signal)
        if window_length < 3 or window_length % 2 == 0:
            raise ValueError("window_length must be an odd integer >= 3.")
        if poly_order >= window_length:
            raise ValueError("poly_order must be less than window_length.")
        if deriv < 0:
            raise ValueError("deriv must be >= 0.")
        if x.size < window_length:
            raise ValueError("Signal length must be at least window_length.")

        half = window_length // 2
        n = np.arange(-half, half + 1, dtype=float)
        a = np.vander(n, N=poly_order + 1, increasing=True)
        pinv = np.linalg.pinv(a)
        import math
        coeffs = pinv[deriv] * math.factorial(deriv) / (delta ** deriv)

        padded = np.pad(x, (half, half), mode="edge")
        out = np.empty_like(x, dtype=float)
        for i in range(x.size):
            window = padded[i : i + window_length]
            out[i] = np.dot(coeffs, window)
        return out

    @staticmethod
    def butterworth_filter(
        signal: ArrayLike,
        cutoff_hz: float,
        sampling_rate_hz: float,
        filter_type: Literal["lowpass", "highpass"] = "lowpass",
        order: int = 2,
    ) -> np.ndarray:
        """Apply a Butterworth filter using SciPy or fallback implementation."""
        x = SignalProcessor._to_1d_array(signal)
        if cutoff_hz <= 0:
            raise ValueError("cutoff_hz must be > 0.")
        if sampling_rate_hz <= 0:
            raise ValueError("sampling_rate_hz must be > 0.")
        if order < 1:
            raise ValueError("order must be >= 1.")

        try:
            from scipy.signal import butter, filtfilt  # type: ignore

            nyquist = 0.5 * sampling_rate_hz
            wn = cutoff_hz / nyquist
            btype = "low" if filter_type == "lowpass" else "high"
            b, a = butter(order, wn, btype=btype, analog=False)
            return filtfilt(b, a, x)
        except Exception:
            alpha = np.exp(-2.0 * np.pi * cutoff_hz / sampling_rate_hz)
            if filter_type == "lowpass":
                y = np.empty_like(x, dtype=float)
                y[0] = x[0]
                for i in range(1, x.size):
                    y[i] = alpha * y[i - 1] + (1.0 - alpha) * x[i]
                return y

            y = np.empty_like(x, dtype=float)
            y[0] = x[0]
            for i in range(1, x.size):
                y[i] = alpha * (y[i - 1] + x[i] - x[i - 1])
            return y

    @staticmethod
    def fft(signal: ArrayLike, sampling_rate_hz: float) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """Compute FFT frequency bins, magnitudes, and power spectrum."""
        x = SignalProcessor._to_1d_array(signal)
        if sampling_rate_hz <= 0:
            raise ValueError("sampling_rate_hz must be > 0.")
        freqs = np.fft.rfftfreq(x.size, d=1.0 / sampling_rate_hz)
        spectrum = np.fft.rfft(x)
        magnitudes = np.abs(spectrum) / x.size
        power = (np.abs(spectrum) ** 2) / x.size
        return freqs, magnitudes, power

    @staticmethod
    def interpolate_signal(
        x_old: ArrayLike,
        y_old: ArrayLike,
        x_new: ArrayLike,
        method: Literal["linear", "nearest"] = "linear",
    ) -> np.ndarray:
        """Interpolate a signal onto a new x-axis."""
        x_old_arr = SignalProcessor._to_1d_array(x_old)
        y_old_arr = SignalProcessor._to_1d_array(y_old)
        x_new_arr = SignalProcessor._to_1d_array(x_new)

        if x_old_arr.size != y_old_arr.size:
            raise ValueError("x_old and y_old must have the same length.")
        if x_old_arr.size < 2:
            raise ValueError("At least two points are required for interpolation.")

        order = np.argsort(x_old_arr)
        x_sorted = x_old_arr[order]
        y_sorted = y_old_arr[order]

        if method == "linear":
            return np.interp(x_new_arr, x_sorted, y_sorted)

        indices = np.searchsorted(x_sorted, x_new_arr, side="left")
        indices = np.clip(indices, 0, x_sorted.size - 1)
        left = np.clip(indices - 1, 0, x_sorted.size - 1)
        right = indices
        choose_right = np.abs(x_new_arr - x_sorted[right]) < np.abs(x_new_arr - x_sorted[left])
        nearest = np.where(choose_right, right, left)
        return y_sorted[nearest]

    @staticmethod
    def resample_signal(
        signal: ArrayLike,
        original_sampling_rate_hz: float,
        target_sampling_rate_hz: float,
    ) -> np.ndarray:
        """Resample a uniformly sampled signal using interpolation."""
        x = SignalProcessor._to_1d_array(signal)
        if original_sampling_rate_hz <= 0 or target_sampling_rate_hz <= 0:
            raise ValueError("Sampling rates must be > 0.")
        if x.size < 2:
            return x.copy()

        duration_s = (x.size - 1) / original_sampling_rate_hz
        original_t = np.linspace(0.0, duration_s, x.size)
        target_count = max(2, int(np.round(duration_s * target_sampling_rate_hz)) + 1)
        target_t = np.linspace(0.0, duration_s, target_count)
        return np.interp(target_t, original_t, x)

    @staticmethod
    def normalize_signal(
        signal: ArrayLike,
        method: Literal["zscore", "minmax", "robust"] = "zscore",
        epsilon: float = 1e-12,
    ) -> np.ndarray:
        """Normalize a signal using z-score, min-max, or robust scaling."""
        x = SignalProcessor._to_1d_array(signal)

        if method == "zscore":
            mean = np.mean(x)
            std = np.std(x)
            return (x - mean) / max(std, epsilon)

        if method == "minmax":
            x_min = np.min(x)
            x_max = np.max(x)
            return (x - x_min) / max(x_max - x_min, epsilon)

        median = np.median(x)
        q1 = np.percentile(x, 25)
        q3 = np.percentile(x, 75)
        iqr = q3 - q1
        return (x - median) / max(iqr, epsilon)

    @staticmethod
    def window_signal(
        signal: ArrayLike,
        window_size: int,
        step_size: int,
    ) -> np.ndarray:
        """Create overlapping sliding windows from a signal."""
        x = SignalProcessor._to_1d_array(signal)
        if window_size < 1 or step_size < 1:
            raise ValueError("window_size and step_size must be >= 1.")
        if x.size < window_size:
            raise ValueError("Signal length must be at least window_size.")

        windows: List[np.ndarray] = []
        for start in range(0, x.size - window_size + 1, step_size):
            windows.append(x[start : start + window_size])
        return np.vstack(windows)

    @staticmethod
    def peak_detection(
        signal: ArrayLike,
        min_distance: int = 1,
        threshold: Optional[float] = None,
    ) -> List[Peak]:
        """Detect local maxima and return peak metadata."""
        if len(signal) < 3:
            return []

        x = SignalProcessor._to_1d_array(signal)
        
        candidates: List[Peak] = []
        for i in range(1, x.size - 1):
            if x[i] <= x[i - 1] or x[i] < x[i + 1]:
                continue
            if threshold is not None and x[i] < threshold:
                continue

            left_min = np.min(x[: i + 1])
            right_min = np.min(x[i:])
            prominence = float(x[i] - max(left_min, right_min))
            candidates.append(Peak(index=i, value=float(x[i]), prominence=prominence))

        candidates.sort(key=lambda p: p.value, reverse=True)
        selected: List[Peak] = []
        for peak in candidates:
            if all(abs(peak.index - other.index) >= min_distance for other in selected):
                selected.append(peak)

        selected.sort(key=lambda p: p.index)
        return selected

    @staticmethod
    def wavelet_interface(signal: ArrayLike, levels: int = 1) -> Tuple[List[np.ndarray], np.ndarray]:
        """Lightweight Haar wavelet decomposition interface."""
        x = SignalProcessor._to_1d_array(signal)
        if levels < 1:
            raise ValueError("levels must be >= 1.")
        coeff = x.copy()
        details: List[np.ndarray] = []

        for _ in range(levels):
            if coeff.size < 2:
                break
            if coeff.size % 2 == 1:
                coeff = np.append(coeff, coeff[-1])
            even = coeff[0::2]
            odd = coeff[1::2]
            approx = (even + odd) / np.sqrt(2.0)
            detail = (even - odd) / np.sqrt(2.0)
            details.append(detail)
            coeff = approx

        return details, coeff

    @staticmethod
    def snr(signal: ArrayLike, noise: ArrayLike) -> float:
        """Compute SNR in dB."""
        s = SignalProcessor._to_1d_array(signal)
        n = SignalProcessor._to_1d_array(noise)
        if s.size != n.size:
            raise ValueError("signal and noise must have the same length.")
        noise_power = np.mean(n ** 2)
        if noise_power <= 0:
            return float("inf")
        return float(10.0 * np.log10(np.mean(s ** 2) / noise_power))


__all__ = [
    "SignalProcessor",
    "Peak",
]
