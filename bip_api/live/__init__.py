"""
bip_api.live — Live hardware telemetry acquisition layer.

Provides:
  - TelemetryFrame: the typed acquisition contract (Pydantic v2)
  - TelemetrySource: abstract base class (ABC) for pluggable sources
  - SimulatedTelemetrySource: software simulator for dev/testing
  - Future: STM32SerialSource (USB CDC / UART) will be added here

No scientific predictions (SOH, RUL, confidence intervals) are ever
produced or stored in this module.
"""
