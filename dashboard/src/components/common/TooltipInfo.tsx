/**
 * TooltipInfo.tsx
 *
 * Plain-language technical term tooltips for Grid & BESS operators.
 *
 * Terms covered:
 * - SOH: State of Health
 * - RUL: Remaining Useful Life
 * - SNR: Signal-to-Noise Ratio
 * - dV_dt: Voltage Rate of Change
 * - Ripple_RMS: Dynamic Voltage Ripple RMS
 * - Dominant_Freq: Dominant Spectral Frequency
 * - Risk: Risk Classification Score
 * - Confidence: AI Model Confidence Score
 */

import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import clsx from 'clsx';

export type TechnicalTerm =
  | 'SOH'
  | 'RUL'
  | 'SNR'
  | 'dV_dt'
  | 'Ripple_RMS'
  | 'Dominant_Freq'
  | 'Risk'
  | 'Confidence';

const TERM_DEFINITIONS: Record<TechnicalTerm, { title: string; explanation: string }> = {
  SOH: {
    title: 'State of Health (SOH)',
    explanation: 'Estimated remaining usable capacity relative to the battery’s original factory reference condition (100%).',
  },
  RUL: {
    title: 'Remaining Useful Life (RUL)',
    explanation: 'Estimated remaining charge/discharge operating cycles or days before reaching end-of-life (80% SOH).',
  },
  SNR: {
    title: 'Signal-to-Noise Ratio (SNR)',
    explanation: 'Ratio of dynamic battery signal magnitude to background noise. Higher values (>20 dB) indicate clean acquisition.',
  },
  dV_dt: {
    title: 'Differential Kinetics (dV/dt)',
    explanation: 'Instantaneous rate of change of terminal voltage over time. Key indicator for rapid impedance shifts.',
  },
  Ripple_RMS: {
    title: 'Dynamic Ripple RMS',
    explanation: 'Root-mean-square of high-frequency residual voltage ripple after baseline detrending.',
  },
  Dominant_Freq: {
    title: 'Dominant Frequency (FFT)',
    explanation: 'Principal spectral peak extracted from dynamic voltage/current residual using Fast Fourier Transform.',
  },
  Risk: {
    title: 'Risk Classification',
    explanation: 'Multi-factor risk score combining degradation rate, thermal excursion, dynamic anomaly signatures, and RUL headroom.',
  },
  Confidence: {
    title: 'Model Confidence',
    explanation: 'Statistical certainty score of the downstream physics-informed AI anomaly detection algorithm.',
  },
};

interface TooltipInfoProps {
  term: TechnicalTerm;
  className?: string;
}

export const TooltipInfo: React.FC<TooltipInfoProps> = ({ term, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const def = TERM_DEFINITIONS[term];

  return (
    <div className={clsx('relative inline-flex items-center', className)}>
      <button
        type="button"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onClick={() => setIsOpen(!isOpen)}
        className="text-[var(--text-subtle)] hover:text-[var(--text-primary)] transition-colors p-0.5 cursor-help"
        aria-label={`Explain ${def.title}`}
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 rounded-lg bg-[var(--bg-tooltip)] border border-[var(--border-main)] shadow-xl z-50 pointer-events-none">
          <div className="text-xs font-mono font-bold text-[var(--accent-voltage)] mb-1">
            {def.title}
          </div>
          <div className="text-[11px] font-sans leading-normal text-[var(--text-secondary)]">
            {def.explanation}
          </div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-[var(--border-main)]" />
        </div>
      )}
    </div>
  );
};
