/**
 * dashboard/src/data/fleetDemoData.ts
 *
 * Deterministic BESS Fleet Demo Dataset for E.ON Future Makers Challenge.
 *
 * Features:
 * - 5 BESS Packs (Pack-01 through Pack-05) on Site: Demo BESS-01
 * - 20 Cells across LFP (8), NMC (8), LCO (4)
 * - SOH, RUL, Risk levels (LOW, MEDIUM, HIGH, CRITICAL), Status (Healthy, Monitoring, Warning, Critical)
 * - Active Anomaly Catalog with WHAT / WHY / SEVERITY / CONFIDENCE / RECOMMENDED ACTION
 * - Recent Events Feed for Grid Operations
 *
 * Explicitly labeled DEMO / SYNTHETIC DATA.
 */

export interface BessPack {
  id: string;             // 'Pack-01' .. 'Pack-05'
  name: string;           // 'Pack-01 (LFP Station)'
  site: string;           // 'Demo BESS-01'
  chemistry: 'LFP' | 'NMC' | 'LCO';
  cellCount: number;
  avgSohPercent: number;
  estRulCycles: number;
  estRulDays: number;
  status: 'HEALTHY' | 'MONITORING' | 'WARNING' | 'CRITICAL';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  voltageNominal: number;
  currentNominal: number;
  tempNominal: number;
  lastUpdated: string;
  activeAnomaliesCount: number;
}

export interface AnomalyAlert {
  id: string;
  assetId: string;        // e.g. 'Pack-04' or 'Pack-02'
  cellId?: string;        // e.g. 'Cell_LFP_03'
  timestamp: string;
  severity: 'NORMAL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskScore: number;      // 0 - 100
  confidencePercent: number;
  title: string;          // WHAT
  signature: string;      // WHY / Detected Signature
  interpretation: string; // Meaning
  recommendedAction: string; // WHAT to do
  isAcknowledged: boolean;
  chemistry: 'LFP' | 'NMC' | 'LCO';
}

export interface FleetEvent {
  id: string;
  timestamp: string;
  type: 'INFO' | 'WARNING' | 'ALERT' | 'SYSTEM';
  source: 'TELEMETRY' | 'INTELLIGENCE' | 'SYSTEM';
  assetId: string;
  description: string;
  isSimulated: boolean;
}

// ── Demo BESS Packs ────────────────────────────────────────────────────────

export const DEMO_BESS_PACKS: BessPack[] = [
  {
    id: 'Pack-01',
    name: 'Pack-01 (Primary Substation LFP)',
    site: 'Demo BESS-01',
    chemistry: 'LFP',
    cellCount: 4,
    avgSohPercent: 96.2,
    estRulCycles: 2850,
    estRulDays: 1420,
    status: 'HEALTHY',
    riskLevel: 'LOW',
    voltageNominal: 3.65,
    currentNominal: -1.0,
    tempNominal: 24.5,
    lastUpdated: 'Just now',
    activeAnomaliesCount: 0,
  },
  {
    id: 'Pack-02',
    name: 'Pack-02 (LFP Secondary Bank)',
    site: 'Demo BESS-01',
    chemistry: 'LFP',
    cellCount: 4,
    avgSohPercent: 93.8,
    estRulCycles: 2410,
    estRulDays: 1205,
    status: 'HEALTHY',
    riskLevel: 'LOW',
    voltageNominal: 3.62,
    currentNominal: -1.0,
    tempNominal: 25.1,
    lastUpdated: 'Just now',
    activeAnomaliesCount: 0,
  },
  {
    id: 'Pack-03',
    name: 'Pack-03 (NMC High-Energy Array)',
    site: 'Demo BESS-01',
    chemistry: 'NMC',
    cellCount: 4,
    avgSohPercent: 88.5,
    estRulCycles: 1450,
    estRulDays: 725,
    status: 'MONITORING',
    riskLevel: 'MEDIUM',
    voltageNominal: 3.75,
    currentNominal: -1.2,
    tempNominal: 28.3,
    lastUpdated: '1 min ago',
    activeAnomaliesCount: 1,
  },
  {
    id: 'Pack-04',
    name: 'Pack-04 (NMC Fast-Response Array)',
    site: 'Demo BESS-01',
    chemistry: 'NMC',
    cellCount: 4,
    avgSohPercent: 81.4,
    estRulCycles: 620,
    estRulDays: 310,
    status: 'WARNING',
    riskLevel: 'HIGH',
    voltageNominal: 3.68,
    currentNominal: -1.5,
    tempNominal: 32.7,
    lastUpdated: 'Just now',
    activeAnomaliesCount: 1,
  },
  {
    id: 'Pack-05',
    name: 'Pack-05 (LCO Auxiliary Bank)',
    site: 'Demo BESS-01',
    chemistry: 'LCO',
    cellCount: 4,
    avgSohPercent: 74.9,
    estRulCycles: 310,
    estRulDays: 155,
    status: 'CRITICAL',
    riskLevel: 'CRITICAL',
    voltageNominal: 3.55,
    currentNominal: -0.8,
    tempNominal: 36.4,
    lastUpdated: 'Just now',
    activeAnomaliesCount: 2,
  },
];

// ── Demo Active Anomalies ──────────────────────────────────────────────────

export const DEMO_ANOMALIES: AnomalyAlert[] = [
  {
    id: 'ANOM-2026-0801',
    assetId: 'Pack-04',
    cellId: 'NMC_Cell_03',
    timestamp: '11 min ago',
    severity: 'HIGH',
    riskScore: 82,
    confidencePercent: 94.2,
    title: 'Abnormal Dynamic Response & Dynamic Resistance Surge',
    signature: 'Phase shift deviation in high-frequency ripple residual (dV/dt perturbation > 2.4 mV/s)',
    interpretation: 'Emerging solid electrolyte interphase (SEI) growth anomaly accelerating local impedance build-up.',
    recommendedAction: 'Schedule thermal and impedance inspection during next low-demand grid window.',
    isAcknowledged: false,
    chemistry: 'NMC',
  },
  {
    id: 'ANOM-2026-0802',
    assetId: 'Pack-05',
    cellId: 'LCO_Cell_01',
    timestamp: '24 min ago',
    severity: 'CRITICAL',
    riskScore: 95,
    confidencePercent: 97.8,
    title: 'Sign-Reversal Anomaly & Elevated Thermal Excursion',
    signature: 'Cross-chemistry signature sign-reversal accompanied by +4.8 °C thermal drift rate',
    interpretation: 'Severe localized degradation signature indicating high thermal risk and accelerated capacity loss.',
    recommendedAction: 'Isolate Pack-05 auxiliary string; initiate active cooling and schedule immediate battery cell replacement.',
    isAcknowledged: false,
    chemistry: 'LCO',
  },
  {
    id: 'ANOM-2026-0803',
    assetId: 'Pack-03',
    cellId: 'NMC_Cell_07',
    timestamp: '1 hour ago',
    severity: 'MEDIUM',
    riskScore: 58,
    confidencePercent: 88.5,
    title: 'LOCO Model Transfer Error Spike',
    signature: 'Cross-chemistry prediction error variance exceeded 1.8% threshold on cycle envelope',
    interpretation: 'Incipient knee-point transition onset causing local feature drift away from baseline NMC model.',
    recommendedAction: 'Monitor cycle envelope trajectory; flag for retraining on next weekly model update.',
    isAcknowledged: true,
    chemistry: 'NMC',
  },
];

// ── Demo Recent Events Feed ────────────────────────────────────────────────

export const DEMO_FLEET_EVENTS: FleetEvent[] = [
  {
    id: 'EVT-101',
    timestamp: '13:42:10 UTC',
    type: 'INFO',
    source: 'TELEMETRY',
    assetId: 'Pack-01',
    description: 'WebSocket stream connected @ 10.0 Hz (SimulatedTelemetrySource)',
    isSimulated: true,
  },
  {
    id: 'EVT-102',
    timestamp: '13:38:45 UTC',
    type: 'ALERT',
    source: 'INTELLIGENCE',
    assetId: 'Pack-05',
    description: 'Critical alert triggered: Sign-reversal anomaly & thermal excursion on Cell_LCO_01',
    isSimulated: true,
  },
  {
    id: 'EVT-103',
    timestamp: '13:31:02 UTC',
    type: 'WARNING',
    source: 'INTELLIGENCE',
    assetId: 'Pack-04',
    description: 'High risk anomaly flagged: Dynamic resistance surge on NMC_Cell_03 (Confidence: 94.2%)',
    isSimulated: true,
  },
  {
    id: 'EVT-104',
    timestamp: '13:20:00 UTC',
    type: 'SYSTEM',
    source: 'SYSTEM',
    assetId: 'Demo BESS-01',
    description: 'Periodic LOCO cross-chemistry audit completed — 20/20 cells verified',
    isSimulated: true,
  },
  {
    id: 'EVT-105',
    timestamp: '13:05:18 UTC',
    type: 'INFO',
    source: 'TELEMETRY',
    assetId: 'Pack-02',
    description: 'Operating state transition: DISCHARGING → IDLE (0.00 A current draw)',
    isSimulated: true,
  },
];
