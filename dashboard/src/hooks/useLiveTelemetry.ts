/**
 * dashboard/src/hooks/useLiveTelemetry.ts
 *
 * Proxy hook for global TelemetryContext stream.
 * Shares single WebSocket connection across all pages in the dashboard.
 */

import { useTelemetryStream, TelemetryContextValue } from '../context/TelemetryContext';

export type UseLiveTelemetryResult = TelemetryContextValue;

export function useLiveTelemetry(): UseLiveTelemetryResult {
  return useTelemetryStream();
}
