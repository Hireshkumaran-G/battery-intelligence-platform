import React, { useState, useMemo } from 'react';
import clsx from 'clsx';
import { ArrowUpDown, ArrowUp, ArrowDown, Search, Download } from 'lucide-react';

interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (row: T) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  width?: string;
}

interface ScientificTableProps<T> {
  data: T[];
  columns: Column<T>[];
  title?: string;
  subtitle?: string;
  downloadUrl?: string;
  downloadFilename?: string;
  className?: string;
  initialPageSize?: number;
}

export function ScientificTable<T extends Record<string, any>>({
  data,
  columns,
  title,
  subtitle,
  downloadUrl,
  downloadFilename = 'data.csv',
  className,
  initialPageSize = 15,
}: ScientificTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortAsc) {
        setSortAsc(false);
      } else {
        setSortKey(null);
        setSortAsc(true);
      }
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();
    return data.filter((row) =>
      Object.values(row).some((val) =>
        val !== null && val !== undefined && String(val).toLowerCase().includes(term)
      )
    );
  }, [data, searchTerm]);

  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    return [...filteredData].sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];

      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortAsc ? valA - valB : valB - valA;
      }

      return sortAsc
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  }, [filteredData, sortKey, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const formatCellValue = (val: any) => {
    if (val === null || val === undefined) {
      return <span className="text-[var(--text-subtle)] font-mono italic">null</span>;
    }
    if (typeof val === 'number') {
      if (Number.isInteger(val)) {
        return <span className="font-mono">{val.toLocaleString()}</span>;
      }
      if (Math.abs(val) < 0.0001 && val !== 0) {
        return <span className="font-mono">{val.toExponential(4)}</span>;
      }
      return <span className="font-mono">{val.toFixed(4)}</span>;
    }
    if (typeof val === 'boolean') {
      return <span className="font-mono uppercase text-xs">{val ? 'true' : 'false'}</span>;
    }
    return String(val);
  };

  return (
    <div className={clsx('scientific-panel flex flex-col bg-[var(--bg-panel)] border border-[var(--border-main)] transition-colors duration-150', className)}>
      {/* Header controls bar */}
      <div className="p-3 border-b border-[var(--border-main)] flex flex-wrap items-center justify-between gap-3 bg-[var(--bg-panel-sub)]">
        <div>
          {title && (
            <h3 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider font-mono">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-xs text-[var(--text-muted)] font-sans mt-0.5">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Filter table rows..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-[var(--bg-root)] border border-[var(--border-sub)] rounded pl-8 pr-3 py-1 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-voltage)] w-48 transition-colors font-mono"
            />
          </div>

          {/* Row count badge */}
          <div className="px-2 py-1 rounded bg-[var(--bg-root)] border border-[var(--border-sub)] text-xs font-mono text-[var(--text-muted)]">
            {sortedData.length} rows
          </div>

          {/* Download Raw CSV button */}
          {downloadUrl && (
            <a
              href={downloadUrl}
              download={downloadFilename}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[var(--bg-panel-sub)] hover:bg-[var(--bg-root)] text-[var(--accent-ripple)] text-xs font-mono border border-[var(--border-sub)] transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-[var(--accent-ripple)]" />
              CSV
            </a>
          )}
        </div>
      </div>

      {/* Table container */}
      <div className="overflow-x-auto min-h-[280px] flex-1">
        <table className="w-full text-left text-xs text-[var(--text-secondary)]">
          <thead className="bg-[var(--bg-panel-sub)] border-b border-[var(--border-main)] sticky top-0 z-10 text-[var(--text-muted)] font-mono uppercase text-[11px] tracking-wider">
            <tr>
              {columns.map((col) => {
                const isSorted = sortKey === col.key;
                return (
                  <th
                    key={String(col.key)}
                    style={{ width: col.width }}
                    onClick={() => handleSort(String(col.key))}
                    className={clsx(
                      'p-2.5 cursor-pointer select-none transition-colors hover:text-[var(--text-primary)] hover:bg-[var(--bg-root)]',
                      col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                    )}
                  >
                    <div className={clsx('inline-flex items-center gap-1.5', col.align === 'right' ? 'justify-end' : '')}>
                      <span>{col.header}</span>
                      {isSorted ? (
                        sortAsc ? (
                          <ArrowUp className="w-3 h-3 text-[var(--accent-voltage)]" />
                        ) : (
                          <ArrowDown className="w-3 h-3 text-[var(--accent-voltage)]" />
                        )
                      ) : (
                        <ArrowUpDown className="w-2.5 h-2.5 text-[var(--text-subtle)] opacity-50 hover:opacity-100" />
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-sub)] font-sans">
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="p-8 text-center text-[var(--text-muted)] font-mono text-xs"
                >
                  No matching records found.
                </td>
              </tr>
            ) : (
              paginatedData.map((row, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-[var(--bg-root)] transition-colors odd:bg-[var(--bg-panel-sub)]/40"
                >
                  {columns.map((col) => (
                    <td
                      key={String(col.key)}
                      className={clsx(
                        'p-2.5 text-[var(--text-secondary)] font-normal',
                        col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                      )}
                    >
                      {col.render ? col.render(row) : formatCellValue(row[col.key as keyof T])}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination footer */}
      <div className="p-2.5 border-t border-[var(--border-main)] flex items-center justify-between text-xs text-[var(--text-muted)] bg-[var(--bg-panel-sub)]">
        <div className="flex items-center gap-2">
          <span>Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-[var(--bg-root)] border border-[var(--border-sub)] rounded px-1.5 py-0.5 text-xs text-[var(--text-primary)] focus:outline-none"
          >
            <option value={10}>10</option>
            <option value={15}>15</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>

        <div className="flex items-center gap-2 font-mono">
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2 py-0.5 rounded bg-[var(--bg-root)] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--border-sub)] text-[var(--text-primary)] border border-[var(--border-sub)] transition-colors"
            >
              Prev
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-2 py-0.5 rounded bg-[var(--bg-root)] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--border-sub)] text-[var(--text-primary)] border border-[var(--border-sub)] transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
