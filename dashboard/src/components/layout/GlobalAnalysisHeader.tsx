import React from 'react';
import clsx from 'clsx';
import { useAppStore, ChemistryFilter } from '../../store/useAppStore';
import { Filter, Sliders, AlertCircle, CheckCircle2 } from 'lucide-react';

interface GlobalAnalysisHeaderProps {
  availableCells: { id: string; chemistry: string; cycles: number }[];
}

export const GlobalAnalysisHeader: React.FC<GlobalAnalysisHeaderProps> = ({ availableCells }) => {
  const {
    selectedChemistry,
    setSelectedChemistry,
    selectedCellId,
    setSelectedCellId,
  } = useAppStore();

  const filteredCells = availableCells.filter(
    (c) => selectedChemistry === 'ALL' || c.chemistry === selectedChemistry
  );

  const handleChemistryChange = (chem: ChemistryFilter) => {
    setSelectedChemistry(chem);
    const matching = availableCells.filter((c) => chem === 'ALL' || c.chemistry === chem);
    if (matching.length > 0 && !matching.some((c) => c.id === selectedCellId)) {
      setSelectedCellId(matching[0].id);
    }
  };

  const getCellCount = (chem: string) => {
    if (chem === 'ALL') return availableCells.length;
    return availableCells.filter((c) => c.chemistry === chem).length;
  };

  return (
    <div className="control-strip px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-3 bg-[var(--bg-control-strip)] border border-[var(--border-main)] shadow-sm transition-colors duration-150">
      {/* Modern Segmented Chemistry Filter */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 text-[11px] font-mono text-[var(--text-muted)] mr-1">
          <Filter className="w-3 h-3 text-[var(--accent-ripple)]" />
          <span>CHEMISTRY:</span>
        </div>

        <div className="flex items-center gap-1 bg-[var(--bg-panel-sub)] p-0.5 rounded-md border border-[var(--border-sub)]">
          {(['ALL', 'LFP', 'NMC', 'LCO'] as ChemistryFilter[]).map((chem) => {
            const isSelected = selectedChemistry === chem;
            const count = getCellCount(chem);

            const activeStyle =
              chem === 'LFP'
                ? 'bg-[var(--bg-panel)] text-[var(--accent-voltage)] border-[var(--accent-voltage)]/50'
                : chem === 'NMC'
                ? 'bg-[var(--bg-panel)] text-[var(--accent-current)] border-[var(--accent-current)]/50'
                : chem === 'LCO'
                ? 'bg-[var(--bg-panel)] text-[var(--accent-thermal)] border-[var(--accent-thermal)]/50'
                : 'bg-[var(--bg-panel)] text-[var(--accent-ripple)] border-[var(--accent-ripple)]/50';

            return (
              <button
                key={chem}
                onClick={() => handleChemistryChange(chem)}
                className={clsx(
                  'px-3 py-1 rounded text-xs font-mono transition-all flex items-center gap-1.5 border',
                  isSelected
                    ? `${activeStyle} font-semibold shadow-sm`
                    : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-panel)]/60'
                )}
              >
                <span>{chem}</span>
                <span
                  className={clsx(
                    'text-[10px] px-1 py-0.2 rounded font-mono',
                    isSelected ? 'bg-black/20 dark:bg-black/40' : 'text-[var(--text-subtle)]'
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Cell Selector & Scientific Protocol Callout */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Cell Selector Dropdown */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 text-[11px] font-mono text-[var(--text-muted)]">
            <Sliders className="w-3 h-3 text-[var(--text-muted)]" />
            <span>INSPECT CELL:</span>
          </div>
          <select
            value={selectedCellId}
            onChange={(e) => setSelectedCellId(e.target.value)}
            className="bg-[var(--bg-panel-sub)] border border-[var(--border-sub)] rounded px-2.5 py-1 text-xs font-mono text-[var(--accent-voltage)] font-semibold focus:outline-none focus:border-[var(--accent-voltage)] transition-colors"
          >
            {filteredCells.map((c) => (
              <option key={c.id} value={c.id}>
                {c.id} ({c.chemistry}, {c.cycles} cycles)
              </option>
            ))}
          </select>
        </div>

        {/* Protocol Indicators */}
        <div className="hidden xl:flex items-center gap-2 pl-2 border-l border-[var(--border-main)] text-[11px] font-mono">
          <span className="flex items-center gap-1 text-[var(--text-muted)] bg-[var(--bg-panel-sub)] px-2 py-0.5 rounded border border-[var(--border-sub)]">
            <AlertCircle className="w-3 h-3 text-[var(--accent-current)]" />
            <span>LFP: Right-Censored (NaN RUL)</span>
          </span>
          <span className="flex items-center gap-1 text-[var(--text-muted)] bg-[var(--bg-panel-sub)] px-2 py-0.5 rounded border border-[var(--border-sub)]">
            <CheckCircle2 className="w-3 h-3 text-[var(--accent-healthy)]" />
            <span>NMC/LCO: EOL Observed</span>
          </span>
        </div>
      </div>
    </div>
  );
};
