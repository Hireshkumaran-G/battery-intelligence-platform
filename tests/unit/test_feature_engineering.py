import numpy as np
import pytest
from unittest.mock import patch, MagicMock

from bip import FeatureEngineer, FeatureVector, SignalProcessor

@pytest.fixture
def feature_engineer():
    """Fixture for a basic FeatureEngineer instance."""
    return FeatureEngineer()

@pytest.fixture
def sample_signal():
    """A simple signal array for testing static methods."""
    return np.array([1.0, 2.0, 3.0, 4.0, 5.0])

@pytest.fixture
def complex_signal():
    """A more complex signal for statistical features."""
    return np.array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])

@pytest.fixture
def signals_for_feature_vector():
    """Sample voltage, current, temperature, and ripple signals."""
    sampling_rate = 100.0
    time = np.linspace(0, 1, int(sampling_rate), endpoint=False) # 1 second of data
    
    voltage = 3.7 + 0.1 * np.sin(2 * np.pi * 5 * time) + 0.01 * np.random.randn(len(time))
    current = 0.5 + 0.05 * np.cos(2 * np.pi * 10 * time) + 0.005 * np.random.randn(len(time))
    temperature = 25 + 0.5 * np.sin(2 * np.pi * 0.1 * time) + 0.02 * np.random.randn(len(time))
    
    # Let's define a clear ripple component for testing
    ripple = 0.02 * np.sin(2 * np.pi * 50 * time) + 0.001 * np.random.randn(len(time))

    return {
        "voltage": voltage,
        "current": current,
        "temperature": temperature,
        "ripple": ripple,
        "sampling_rate_hz": sampling_rate,
        "charge_time_s": 3600.0, # 1 hour
    }


# ==============================================================================
# Helper methods tests
# ==============================================================================

@pytest.mark.unit
def test_to_array_valid_input(sample_signal):
    """Test _to_array with valid inputs."""
    assert np.array_equal(FeatureEngineer._to_array([1, 2, 3]), np.array([1.0, 2.0, 3.0]))
    assert np.array_equal(FeatureEngineer._to_array(sample_signal), sample_signal)
    assert FeatureEngineer._to_array(sample_signal).dtype == np.float64

@pytest.mark.unit
def test_to_array_empty_input_raises_error():
    """Test _to_array with empty input raises ValueError."""
    with pytest.raises(ValueError, match="Signal must not be empty."):
        FeatureEngineer._to_array([])
    with pytest.raises(ValueError, match="Signal must not be empty."):
        FeatureEngineer._to_array(np.array([]))

@pytest.mark.unit
def test_safe_stat():
    """Test _safe_stat for finite and non-finite values."""
    assert FeatureEngineer._safe_stat(1.23) == 1.23
    assert FeatureEngineer._safe_stat(np.nan) == 0.0
    assert FeatureEngineer._safe_stat(np.inf) == 0.0
    assert FeatureEngineer._safe_stat(-np.inf) == 0.0

# ==============================================================================
# Statistical Feature Methods Tests
# ==============================================================================

@pytest.mark.unit
def test_variance(sample_signal):
    """Test _variance calculation."""
    np.testing.assert_allclose(FeatureEngineer._variance(sample_signal), np.var(sample_signal))
    assert FeatureEngineer._variance(np.array([5, 5, 5])) == 0.0

@pytest.mark.unit
def test_skewness(sample_signal):
    """Test _skewness calculation."""
    # For a symmetrical distribution (like uniform range), skewness should be close to 0
    np.testing.assert_allclose(FeatureEngineer._skewness(sample_signal), 0.0, atol=1e-6)
    # Test with known skewed data
    skewed_positive = np.array([1, 1, 1, 2, 3, 10])
    assert FeatureEngineer._skewness(skewed_positive) > 0
    skewed_negative = np.array([10, 9, 8, 8, 8, 1])
    assert FeatureEngineer._skewness(skewed_negative) < 0
    assert FeatureEngineer._skewness(np.array([5, 5, 5])) == 0.0 # Standard deviation is zero

@pytest.mark.unit
def test_kurtosis(sample_signal):
    """Test _kurtosis calculation."""
    # For a uniform distribution, excess kurtosis is typically negative
    np.testing.assert_allclose(FeatureEngineer._kurtosis(sample_signal), -1.3, atol=1e-6)
    # Test with known leptokurtic data (higher peak, fatter tails)
    leptokurtic = np.array([0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0])
    assert FeatureEngineer._kurtosis(leptokurtic) < 0.0 # This is actually negative for this example as it's flatter than normal
    # Test with data where std is zero
    assert FeatureEngineer._kurtosis(np.array([5, 5, 5])) == 0.0

@pytest.mark.unit
def test_entropy(sample_signal):
    """Test _entropy calculation."""
    entropy_val = FeatureEngineer._entropy(sample_signal)
    assert entropy_val >= 0
    # Higher entropy for more uniformly distributed data
    assert FeatureEngineer._entropy(np.array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])) > FeatureEngineer._entropy(np.array([1, 1, 1, 1, 1, 10, 10, 10, 10, 10]))
    assert FeatureEngineer._entropy(np.array([5, 5, 5])) == 0.0 # No variability, zero entropy

@pytest.mark.unit
def test_crest_factor(sample_signal):
    """Test _crest_factor calculation."""
    # For a sine wave, crest factor is sqrt(2)
    sine_wave = np.sin(np.linspace(0, 2 * np.pi, 100))
    np.testing.assert_allclose(FeatureEngineer._crest_factor(sine_wave), np.sqrt(2), rtol=1e-2)
    # For constant signal, crest factor is 1
    assert FeatureEngineer._crest_factor(np.array([1, 1, 1])) == 1.0
    assert FeatureEngineer._crest_factor(np.array([0, 0, 0])) == 0.0 # RMS is zero

@pytest.mark.unit
def test_rms(sample_signal):
    """Test _rms calculation."""
    np.testing.assert_allclose(FeatureEngineer._rms(sample_signal), np.sqrt(np.mean(sample_signal**2)))
    assert FeatureEngineer._rms(np.array([0, 0, 0])) == 0.0

@pytest.mark.unit
def test_ptp(sample_signal):
    """Test _ptp calculation."""
    assert FeatureEngineer._ptp(sample_signal) == np.ptp(sample_signal)
    assert FeatureEngineer._ptp(np.array([5, 5, 5])) == 0.0

@pytest.mark.unit
def test_rolling_stats(complex_signal):
    """Test _rolling_stats calculation."""
    # Test with window smaller than signal
    mean, std = FeatureEngineer._rolling_stats(complex_signal, window_size=5)
    np.testing.assert_allclose(mean, np.mean(complex_signal[-5:]))
    np.testing.assert_allclose(std, np.std(complex_signal[-5:]))

    # Test with window larger than signal
    mean_full, std_full = FeatureEngineer._rolling_stats(complex_signal, window_size=20)
    np.testing.assert_allclose(mean_full, np.mean(complex_signal))
    np.testing.assert_allclose(std_full, np.std(complex_signal))

    # Test window size 1
    mean_1, std_1 = FeatureEngineer._rolling_stats(np.array([10]), window_size=1)
    assert mean_1 == 10.0
    assert std_1 == 0.0

@pytest.mark.unit
def test_rolling_stats_invalid_window_size():
    """Test _rolling_stats with invalid window_size."""
    with pytest.raises(ValueError, match="window_size must be >= 1."):
        FeatureEngineer._rolling_stats(np.array([1, 2, 3]), 0)

# ==============================================================================
# Frequency and Ripple Feature Methods Tests
# ==============================================================================

@pytest.mark.unit
@patch.object(SignalProcessor, 'fft')
def test_frequency_features(mock_fft):
    """Test _frequency_features using a mocked FFT."""
    # Mock FFT to return known values
    freqs = np.array([0.0, 1.0, 2.0, 3.0])
    magnitudes = np.array([10.0, 5.0, 8.0, 2.0]) # Dominant at 0Hz, then 2Hz
    power = np.array([100.0, 25.0, 64.0, 4.0])

    mock_fft.return_value = (freqs, magnitudes, power)

    x = np.array([1, 2, 3, 4])
    sampling_rate_hz = 10.0
    features = FeatureEngineer._frequency_features(x, sampling_rate_hz)

    mock_fft.assert_called_once_with(x, sampling_rate_hz)
    np.testing.assert_allclose(features["dominant_frequency"], freqs[0]) # Argmax is 0
    np.testing.assert_allclose(features["fft_energy"], np.sum(power))

    # Test spectral entropy calculation based on mock data
    expected_normalized_power = power / np.sum(power)
    expected_spectral_entropy = -np.sum(expected_normalized_power * np.log2(expected_normalized_power))
    np.testing.assert_allclose(features["spectral_entropy"], expected_spectral_entropy)

@pytest.mark.unit
def test_frequency_features_empty_magnitudes():
    """Test _frequency_features with empty magnitudes from FFT."""
    # Patch FFT to return empty arrays
    with patch.object(SignalProcessor, 'fft', return_value=(np.array([]), np.array([]), np.array([]))):
        x = np.array([1, 2, 3, 4])
        sampling_rate_hz = 10.0
        features = FeatureEngineer._frequency_features(x, sampling_rate_hz)
        assert features["dominant_frequency"] == 0.0
        assert features["fft_energy"] == 0.0
        assert features["spectral_entropy"] == 0.0

@pytest.mark.unit
def test_ripple_features():
    """Test _ripple_features calculation."""
    ripple = np.array([0.1, -0.2, 0.3, -0.1])
    current = np.array([1.0, 1.1, 1.2, 1.3])
    voltage = np.array([3.7, 3.8, 3.75, 3.8])

    features = FeatureEngineer._ripple_features(ripple, current, voltage)

    np.testing.assert_allclose(features["ripple_rms"], np.sqrt(np.mean(ripple**2)))
    np.testing.assert_allclose(features["peak_ripple"], np.max(np.abs(ripple)))
    np.testing.assert_allclose(features["voltage_ripple"], np.sqrt(np.mean(ripple**2))) # Assumes ripple is voltage ripple
    np.testing.assert_allclose(features["current_ripple"], np.sqrt(np.mean(current**2)))
    np.testing.assert_allclose(features["rms_current"], np.sqrt(np.mean(current**2)))
    np.testing.assert_allclose(features["rms_voltage"], np.sqrt(np.mean(voltage**2)))
    np.testing.assert_allclose(features["peak_to_peak_ripple"], np.ptp(ripple))

@pytest.mark.unit
def test_ripple_features_empty_signals():
    """Test _ripple_features with empty current/voltage for graceful handling."""
    ripple = np.array([0.1, -0.2, 0.3, -0.1])
    empty_arr = np.array([])
    
    features = FeatureEngineer._ripple_features(ripple, empty_arr, empty_arr)
    assert features["current_ripple"] == 0.0
    assert features["rms_current"] == 0.0
    assert features["rms_voltage"] == 0.0
    np.testing.assert_allclose(features["ripple_rms"], np.sqrt(np.mean(ripple**2)))


# ==============================================================================
# Main Feature Computation Logic Tests
# ==============================================================================

@pytest.mark.unit
@patch.object(SignalProcessor, 'fft', MagicMock(return_value=(
    np.array([0.0, 1.0]), np.array([10.0, 5.0]), np.array([100.0, 25.0])
)))
def test_compute_feature_vector_basic(feature_engineer, signals_for_feature_vector):
    """Test compute_feature_vector with basic inputs."""
    data = signals_for_feature_vector
    fv = feature_engineer.compute_feature_vector(
        voltage=data["voltage"],
        current=data["current"],
        temperature=data["temperature"],
        sampling_rate_hz=data["sampling_rate_hz"],
        charge_time_s=data["charge_time_s"],
    )

    assert isinstance(fv, FeatureVector)
    assert len(fv.names) > 0
    assert fv.values.shape == (len(fv.names),)
    assert "voltage_mean" in fv.as_dict()
    assert "dominant_frequency" in fv.as_dict()
    assert "ripple_rms" in fv.as_dict() # Even without explicit ripple, it's derived from voltage
    assert "charge_time_s" in fv.as_dict()
    assert fv.as_dict()["charge_time_s"] == data["charge_time_s"]
    assert fv.as_dict()["voltage_mean"] == FeatureEngineer._safe_stat(float(np.mean(data["voltage"])))
    assert fv.as_dict()["voltage_std"] == FeatureEngineer._safe_stat(float(np.std(data["voltage"])))


@pytest.mark.unit
@patch.object(SignalProcessor, 'fft', MagicMock(return_value=(
    np.array([0.0, 1.0]), np.array([10.0, 5.0]), np.array([100.0, 25.0])
)))
def test_compute_feature_vector_with_explicit_ripple(feature_engineer, signals_for_feature_vector):
    """Test compute_feature_vector when an explicit ripple signal is provided."""
    data = signals_for_feature_vector
    fv = feature_engineer.compute_feature_vector(
        voltage=data["voltage"],
        current=data["current"],
        temperature=data["temperature"],
        sampling_rate_hz=data["sampling_rate_hz"],
        ripple=data["ripple"],
    )
    # When ripple is explicit, 'ripple_rms' should reflect that signal
    np.testing.assert_allclose(fv.as_dict()["ripple_rms"], FeatureEngineer._rms(data["ripple"]))


@pytest.mark.unit
@patch.object(SignalProcessor, 'fft', MagicMock(return_value=(
    np.array([0.0, 1.0]), np.array([10.0, 5.0]), np.array([100.0, 25.0])
)))
def test_compute_feature_vector_no_charge_time(feature_engineer, signals_for_feature_vector):
    """Test compute_feature_vector when charge_time_s is None."""
    data = signals_for_feature_vector
    fv = feature_engineer.compute_feature_vector(
        voltage=data["voltage"],
        current=data["current"],
        temperature=data["temperature"],
        sampling_rate_hz=data["sampling_rate_hz"],
        charge_time_s=None,
    )
    assert fv.as_dict()["charge_time_s"] == 0.0 # Default to 0.0 when None


@pytest.mark.unit
@patch.object(SignalProcessor, 'fft', MagicMock(return_value=(
    np.array([0.0, 1.0]), np.array([10.0, 5.0]), np.array([100.0, 25.0])
)))
def test_compute_feature_vector_explicit_feature_names(signals_for_feature_vector):
    """Test FeatureEngineer initialization with explicit feature names to enforce order."""
    
    # Define a custom order, including some not present in default set
    custom_feature_names = ["voltage_mean", "current_std", "non_existent_feature", "voltage_max"]
    feature_engineer = FeatureEngineer(feature_names=custom_feature_names)

    data = signals_for_feature_vector
    fv = feature_engineer.compute_feature_vector(
        voltage=data["voltage"],
        current=data["current"],
        temperature=data["temperature"],
        sampling_rate_hz=data["sampling_rate_hz"],
    )

    # Check if the existing features are in the specified order
    expected_ordered_names = ["voltage_mean", "current_std", "voltage_max"]
    assert fv.names[:len(expected_ordered_names)] == expected_ordered_names
    # The non_existent_feature should not be in the final list
    assert "non_existent_feature" not in fv.names
    # All default features should still be present, just potentially reordered
    assert "voltage_skewness" in fv.names # Example of a default feature

@pytest.mark.unit
def test_compute_feature_vector_empty_signals():
    """Test compute_feature_vector with empty signals."""
    empty_arr = np.array([])
    sampling_rate = 100.0
    fe = FeatureEngineer()
    
    # Expect ValueErrors from _to_array for required signals
    with pytest.raises(ValueError, match="Signal must not be empty."):
        fe.compute_feature_vector(empty_arr, empty_arr, empty_arr, sampling_rate)

    # Test with valid voltage but empty current/temp if it passes _to_array (which it won't if all are empty initially)
    # The internal _safe_stat should handle NaNs from np.mean/std on empty arrays for optional signals.
    # However, primary signals (voltage, current, temp) are strictly checked.
    # To test _safe_stat on actual NaN output from numpy functions, we'd need valid input arrays.
    # For now, rely on `_to_array`'s strict check.


# ==============================================================================
# Window Features Tests
# ==============================================================================

@pytest.mark.unit
@patch.object(SignalProcessor, 'window_signal')
def test_compute_window_features(mock_window_signal, feature_engineer):
    """Test compute_window_features by mocking window_signal."""
    signal = np.array([1.0, 2.0, 3.0, 4.0, 5.0, 6.0])
    window_size = 3
    step_size = 1
    
    # Mock output of SignalProcessor.window_signal
    mock_windows = np.array([
        [1.0, 2.0, 3.0],
        [2.0, 3.0, 4.0],
        [3.0, 4.0, 5.0],
        [4.0, 5.0, 6.0],
    ])
    mock_window_signal.return_value = mock_windows

    window_features = feature_engineer.compute_window_features(signal, window_size, step_size)

    # FIX: Assert call explicitly for numpy arrays
    mock_window_signal.assert_called_once()
    call_args, call_kwargs = mock_window_signal.call_args
    np.testing.assert_array_equal(call_args[0], signal)
    assert call_kwargs == {'window_size': window_size, 'step_size': step_size}

    np.testing.assert_allclose(window_features["window_mean"], np.array([2.0, 3.0, 4.0, 5.0]))
    np.testing.assert_allclose(window_features["window_std"], np.std(mock_windows, axis=1))
    np.testing.assert_allclose(window_features["window_min"], np.array([1.0, 2.0, 3.0, 4.0]))
    np.testing.assert_allclose(window_features["window_max"], np.array([3.0, 4.0, 5.0, 6.0]))
    np.testing.assert_allclose(window_features["window_rms"], np.sqrt(np.mean(mock_windows**2, axis=1)))
    np.testing.assert_allclose(window_features["window_energy"], np.sum(mock_windows**2, axis=1))

@pytest.mark.unit
def test_compute_window_features_empty_signal(feature_engineer):
    """Test compute_window_features with an empty signal."""
    # SignalProcessor.window_signal will raise ValueError for empty signals if window_size is >= 1
    with pytest.raises(ValueError, match="Signal must not be empty."):
        feature_engineer.compute_window_features(np.array([]), window_size=5, step_size=1)


# ==============================================================================
# Feature Selection Tests
# ==============================================================================

@pytest.mark.unit
def test_select_features(feature_engineer):
    """Test select_features method."""
    feature_matrix = np.array([
        [1.0, 2.0, 3.0, 4.0],
        [5.0, 6.0, 7.0, 8.0],
        [9.0, 10.0, 11.0, 12.0],
    ])
    all_feature_names = ["feat_A", "feat_B", "feat_C", "feat_D"]

    # Select a subset
    selected_names = ["feat_B", "feat_D"]
    reduced_matrix, new_names = feature_engineer.select_features(feature_matrix, all_feature_names, selected_names)
    expected_reduced_matrix = np.array([
        [2.0, 4.0],
        [6.0, 8.0],
        [10.0, 12.0],
    ])
    np.testing.assert_array_equal(reduced_matrix, expected_reduced_matrix)
    assert new_names == ["feat_B", "feat_D"]

    # Select names in different order
    selected_names_reordered = ["feat_D", "feat_A"]
    reduced_matrix_reordered, new_names_reordered = feature_engineer.select_features(feature_matrix, all_feature_names, selected_names_reordered)
    expected_reduced_matrix_reordered = np.array([
        [4.0, 1.0],
        [8.0, 5.0],
        [12.0, 9.0],
    ])
    np.testing.assert_array_equal(reduced_matrix_reordered, expected_reduced_matrix_reordered)
    assert new_names_reordered == ["feat_D", "feat_A"]

    # Select non-existent features
    selected_non_existent = ["feat_X", "feat_Y"]
    reduced_matrix_empty, new_names_empty = feature_engineer.select_features(feature_matrix, all_feature_names, selected_non_existent)
    assert reduced_matrix_empty.shape == (feature_matrix.shape[0], 0)
    assert new_names_empty == []

    # Select mixed existing and non-existent
    selected_mixed = ["feat_A", "feat_Z", "feat_C"]
    reduced_matrix_mixed, new_names_mixed = feature_engineer.select_features(feature_matrix, all_feature_names, selected_mixed)
    expected_reduced_matrix_mixed = np.array([
        [1.0, 3.0],
        [5.0, 7.0],
        [9.0, 11.0],
    ])
    np.testing.assert_array_equal(reduced_matrix_mixed, expected_reduced_matrix_mixed)
    assert new_names_mixed == ["feat_A", "feat_C"]

@pytest.mark.unit
def test_select_features_invalid_matrix_dimensions(feature_engineer):
    """Test select_features with invalid feature_matrix dimensions."""
    single_dim_matrix = np.array([1, 2, 3, 4])
    feature_names = ["a", "b", "c", "d"]
    with pytest.raises(ValueError, match="feature_matrix must be two-dimensional."):
        feature_engineer.select_features(single_dim_matrix, feature_names, ["a"])

@pytest.mark.unit
def test_feature_vector_as_dict():
    """Test FeatureVector.as_dict method."""
    names = ["f1", "f2", "f3"]
    values = np.array([1.1, 2.2, 3.3])
    fv = FeatureVector(names, values)
    expected_dict = {"f1": 1.1, "f2": 2.2, "f3": 3.3}
    np.testing.assert_allclose(list(fv.as_dict().values()), list(expected_dict.values()))
    assert fv.as_dict().keys() == expected_dict.keys()