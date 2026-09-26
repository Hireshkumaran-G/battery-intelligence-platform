import numpy as np
import pytest
from unittest.mock import patch, MagicMock

from bip import ConfigManager, PhysicsConfig, SignalProcessingConfig, PhysicsEngine, SignalProcessor


# ==============================================================================
# Fixtures
# ==============================================================================

@pytest.fixture
def mock_physics_config():
    """Mock PhysicsConfig instance."""
    return PhysicsConfig(
        ripple_decomposition_method="polynomial_detrend",
        detrending_order=3,
        derivative_window_size=5,
        snr_threshold=10.0,
        enable_electrochemical_models=False,
    )

@pytest.fixture
def mock_signal_processing_config():
    """Mock SignalProcessingConfig instance."""
    return SignalProcessingConfig(
        savitzky_golay_window=7,
        savitzky_golay_poly_order=3,
    )

@pytest.fixture
def mock_config_manager(mock_physics_config, mock_signal_processing_config):
    """Patch ConfigManager methods for isolated testing."""
    with patch.object(ConfigManager, 'is_loaded', return_value=True), \
         patch.object(ConfigManager, 'get_physics_config', return_value=mock_physics_config), \
         patch.object(ConfigManager, 'get_signal_processing_config', return_value=mock_signal_processing_config):
        yield

@pytest.fixture
def physics_engine(mock_config_manager):
    """Fixture for a PhysicsEngine instance with mocked config."""
    return PhysicsEngine()

@pytest.fixture
def sample_signal():
    """A simple signal without strong trend."""
    return np.array([1.0, 1.1, 1.0, 0.9, 1.0, 1.1, 1.0])

@pytest.fixture
def signal_with_linear_trend():
    """A signal with a clear linear trend."""
    x = np.arange(10)
    return 2 * x + 5 + 0.1 * np.random.randn(10)

@pytest.fixture
def signal_with_quadratic_trend():
    """A signal with a clear quadratic trend."""
    x = np.arange(10)
    return 0.5 * x**2 - x + 10 + 0.1 * np.random.randn(10)

@pytest.fixture
def signal_for_derivatives():
    """A signal suitable for derivative testing."""
    x = np.linspace(0, 2 * np.pi, 20)
    return np.sin(x)

@pytest.fixture
def sample_electrochem_signals():
    """Sample signals for electrochemical interpretation."""
    time = np.arange(10)
    voltage = 3.7 + 0.1 * np.sin(time)
    current = 0.5 + 0.05 * np.cos(time)
    temperature = 25 + 0.5 * np.sin(0.1 * time)
    return voltage, current, temperature, time

# ==============================================================================
# PhysicsEngine Initialization Tests
# ==============================================================================

@pytest.mark.unit
def test_physics_engine_init_loads_config(mock_config_manager, mock_physics_config):
    """Test PhysicsEngine initializes and loads config via ConfigManager."""
    engine = PhysicsEngine()
    assert engine.config == mock_physics_config
    ConfigManager.get_physics_config.assert_called_once()


# ==============================================================================
# Polynomial Detrending Tests
# ==============================================================================

@pytest.mark.unit
def test_polynomial_detrend_linear_trend(physics_engine, signal_with_linear_trend):
    """Test detrending a linear signal."""
    detrended = physics_engine.polynomial_detrend(signal_with_linear_trend, order=1)
    # Mean of detrended signal should be very close to zero
    np.testing.assert_allclose(np.mean(detrended), 0.0, atol=1e-6)
    # Variance should be significantly reduced compared to original (noise only)
    assert np.var(detrended) < np.var(signal_with_linear_trend)

@pytest.mark.unit
def test_polynomial_detrend_quadratic_trend(physics_engine, signal_with_quadratic_trend):
    """Test detrending a quadratic signal."""
    detrended = physics_engine.polynomial_detrend(signal_with_quadratic_trend, order=2)
    np.testing.assert_allclose(np.mean(detrended), 0.0, atol=1e-6)
    assert np.var(detrended) < np.var(signal_with_quadratic_trend)

@pytest.mark.unit
def test_polynomial_detrend_config_order(physics_engine, signal_with_quadratic_trend, mock_physics_config):
    """Test detrending uses order from config if not provided."""
    # Ensure fixture config has detrending_order=3 (default in our mock config)
    mock_physics_config.detrending_order = 2 # Change mock config's value
    detrended = physics_engine.polynomial_detrend(signal_with_quadratic_trend, order=None)
    # The detrended signal should now have its quadratic trend removed by order 2
    np.testing.assert_allclose(np.mean(detrended), 0.0, atol=1e-6)
    assert np.var(detrended) < np.var(signal_with_quadratic_trend)

@pytest.mark.unit
def test_polynomial_detrend_short_signal_returns_original(physics_engine, mock_physics_config):
    """Test detrending a signal shorter than order+2 returns original."""
    mock_physics_config.detrending_order = 3 # Default mock config
    short_signal = np.array([1, 2, 3, 4]) # Length 4, order+2 = 5
    detrended = physics_engine.polynomial_detrend(short_signal, order=None)
    np.testing.assert_array_equal(detrended, short_signal)

@pytest.mark.unit
def test_polynomial_detrend_empty_signal(physics_engine):
    """Test detrending an empty signal."""
    empty_signal = np.array([])
    detrended = physics_engine.polynomial_detrend(empty_signal, order=1)
    np.testing.assert_array_equal(detrended, empty_signal)

# ==============================================================================
# Ripple Decomposition Tests
# ==============================================================================

@pytest.mark.unit
def test_ripple_decomposition_polynomial_detrend_method(physics_engine, signal_with_linear_trend, mock_physics_config):
    """Test ripple decomposition using polynomial detrending."""
    mock_physics_config.ripple_decomposition_method = "polynomial_detrend" # Ensure this is set
    mock_physics_config.detrending_order = 1 # Linear trend, so order 1

    # Mock the internal call to polynomial_detrend if we want strict isolation,
    # but here we rely on its correct functioning, which is already tested.
    ripple_voltage = physics_engine.ripple_decomposition(signal_with_linear_trend)
    np.testing.assert_allclose(np.mean(ripple_voltage), 0.0, atol=1e-6)
    assert np.var(ripple_voltage) < np.var(signal_with_linear_trend)

@pytest.mark.unit
def test_ripple_decomposition_unsupported_method_returns_original(physics_engine, sample_signal, mock_physics_config):
    """Test ripple decomposition with unsupported method returns original signal."""
    mock_physics_config.ripple_decomposition_method = "unsupported_method" # Simulate unsupported method
    ripple_voltage = physics_engine.ripple_decomposition(sample_signal)
    np.testing.assert_array_equal(ripple_voltage, sample_signal)


# ==============================================================================
# Derivative Calculation Tests
# ==============================================================================

@pytest.mark.unit
@patch.object(SignalProcessor, 'savitzky_golay_filter')
def test_calculate_derivatives_basic(mock_sg_filter, physics_engine, signal_for_derivatives, mock_physics_config):
    """Test derivative calculation using Savitzky-Golay (mocked)."""
    # Mock SG filter to return known derivatives
    # For sin(x), D1 = cos(x), D2 = -sin(x)
    x = np.linspace(0, 2 * np.pi, 20)
    mock_d1 = np.cos(x)
    mock_d2 = -np.sin(x)

    # The SG filter is called twice: once for deriv=1, once for deriv=2
    mock_sg_filter.side_effect = [mock_d1, mock_d2]

    d1, d2 = physics_engine.calculate_derivatives(signal_for_derivatives)

    # Check that SG filter was called correctly
    assert mock_sg_filter.call_count == 2
    mock_sg_filter.call_args_list[0].assert_called_with(signal_for_derivatives, window_length=mock_physics_config.derivative_window_size, poly_order=2, deriv=1, delta=1.0)
    mock_sg_filter.call_args_list[1].assert_called_with(signal_for_derivatives, window_length=mock_physics_config.derivative_window_size, poly_order=3, deriv=2, delta=1.0)

    # Only the middle part is filled, edges are NaN
    half_window = mock_physics_config.derivative_window_size // 2
    np.testing.assert_allclose(d1[half_window:-half_window], mock_d1[half_window:-half_window], atol=1e-6)
    np.testing.assert_allclose(d2[half_window:-half_window], mock_d2[half_window:-half_window], atol=1e-6)
    assert np.isnan(d1[0]) and np.isnan(d1[-1])
    assert np.isnan(d2[0]) and np.isnan(d2[-1])


@pytest.mark.unit
def test_calculate_derivatives_short_signal(physics_engine, mock_physics_config):
    """Test derivatives for signal shorter than window size returns NaNs."""
    mock_physics_config.derivative_window_size = 5 # Default mock config
    short_signal = np.array([1, 2, 3]) # Length 3
    d1, d2 = physics_engine.calculate_derivatives(short_signal)
    assert np.all(np.isnan(d1))
    assert np.all(np.isnan(d2))
    assert d1.shape == short_signal.shape

@pytest.mark.unit
def test_calculate_derivatives_invalid_window_size(physics_engine, sample_signal, mock_physics_config):
    """Test derivatives with invalid window size falls back to default."""
    # Temporarily set an invalid window size in the mock config
    mock_physics_config.derivative_window_size = 2 # Invalid, will be overridden to 5
    
    # We expect calculate_derivatives to use the default 5 from mock_physics_config
    # So the signal must be long enough for window 5.
    signal = np.arange(10)
    
    # Patch SG filter as it will be called internally
    with patch.object(SignalProcessor, 'savitzky_golay_filter', return_value=np.zeros_like(signal)) as mock_sg:
        d1, d2 = physics_engine.calculate_derivatives(signal, window_size=2) # Pass invalid window_size
        
        # Verify that SG filter was called with the *default* window size (5)
        mock_sg.assert_any_call(signal, window_length=5, poly_order=2, deriv=1, delta=1.0)
        # Reset mock_physics_config's derivative_window_size to default for other tests
        mock_physics_config.derivative_window_size = 5


# ==============================================================================
# SNR Computation Tests
# ==============================================================================

@pytest.mark.unit
def test_compute_snr_no_noise_estimate(physics_engine, signal_with_linear_trend, mock_physics_config):
    """Test SNR computation when noise is estimated via detrending."""
    # For a signal with a strong trend, detrended signal is mostly noise
    # Signal power of original vs noise power of detrended (AC component)
    
    # Mock polynomial_detrend to return a known "noise" component
    with patch.object(physics_engine, 'polynomial_detrend', return_value=np.array([0.1, -0.1, 0.1, -0.1])) as mock_detrend:
        signal_power = np.mean(signal_with_linear_trend**2)
        noise_power = np.mean(np.array([0.1, -0.1, 0.1, -0.1])**2) # Should be 0.01
        expected_snr = 10 * np.log10(signal_power / noise_power)

        snr = physics_engine.compute_snr(signal_with_linear_trend)
        mock_detrend.assert_called_once_with(signal_with_linear_trend, mock_physics_config.detrending_order)
        np.testing.assert_allclose(snr, expected_snr)

@pytest.mark.unit
def test_compute_snr_with_noise_estimate(physics_engine, sample_signal):
    """Test SNR computation with explicit noise estimate."""
    signal = np.array([1, 1, 1, 1])
    noise_estimate = np.array([0.1, 0.1, 0.1, 0.1])
    # Signal Power = 1, Noise Power = 0.01. SNR = 10 * log10(1/0.01) = 20 dB
    snr = physics_engine.compute_snr(signal, noise_estimate=noise_estimate)
    np.testing.assert_allclose(snr, 20.0, rtol=1e-6)

@pytest.mark.unit
def test_compute_snr_zero_noise_power_returns_inf(physics_engine):
    """Test SNR returns inf when noise power is zero."""
    signal = np.array([1, 1, 1])
    noise_estimate = np.array([0, 0, 0])
    snr = physics_engine.compute_snr(signal, noise_estimate=noise_estimate)
    assert snr == float('inf')

@pytest.mark.unit
def test_compute_snr_zero_signal_power_and_zero_noise_power_returns_neg_inf(physics_engine):
    """Test SNR returns -inf when both signal and noise power are zero."""
    signal = np.array([0, 0, 0])
    noise_estimate = np.array([0, 0, 0])
    snr = physics_engine.compute_snr(signal, noise_estimate=noise_estimate)
    assert snr == float('-inf')

@pytest.mark.unit
def test_compute_snr_empty_signal(physics_engine):
    """Test SNR returns -inf for an empty signal."""
    empty_signal = np.array([])
    snr = physics_engine.compute_snr(empty_signal)
    assert snr == float('-inf')

@pytest.mark.unit
def test_compute_snr_mismatching_lengths(physics_engine, sample_signal):
    """Test SNR raises ValueError for mismatching signal and noise lengths."""
    short_noise = np.array([0.1, 0.2])
    with pytest.raises(ValueError, match="Noise estimate array must have the same length as the signal."):
        physics_engine.compute_snr(sample_signal, noise_estimate=short_noise)


# ==============================================================================
# Electrochemical Interpretation Tests
# ==============================================================================

@pytest.mark.unit
def test_electrochemical_interpretation_basic_metrics(physics_engine, sample_electrochem_signals):
    """Test basic electrochemical metrics are calculated."""
    voltage, current, temperature, time = sample_electrochem_signals
    results = physics_engine.electrochemical_interpretation(voltage, current, temperature, time)

    assert 'avg_abs_current' in results
    assert 'temp_std_dev' in results
    
    np.testing.assert_allclose(results['avg_abs_current'], np.mean(np.abs(current)))
    np.testing.assert_allclose(results['temp_std_dev'], np.std(temperature))

@pytest.mark.unit
def test_electrochemical_interpretation_empty_signals(physics_engine):
    """Test electrochemical interpretation with empty signals."""
    empty_arr = np.array([])
    results = physics_engine.electrochemical_interpretation(empty_arr, empty_arr, empty_arr, empty_arr)
    assert 'avg_abs_current' not in results
    assert 'temp_std_dev' not in results

@pytest.mark.unit
def test_electrochemical_interpretation_enabled_models(physics_engine, sample_electrochem_signals, mock_physics_config):
    """Test behavior when electrochemical models are enabled."""
    mock_physics_config.enable_electrochemical_models = True # Enable in mock config
    voltage, current, temperature, time = sample_electrochem_signals
    results = physics_engine.electrochemical_interpretation(voltage, current, temperature, time)
    # For now, it logs a message but doesn't add specific outputs.
    # We primarily check that it doesn't fail and contains basic metrics.
    assert 'avg_abs_current' in results
    assert 'temp_std_dev' in results
