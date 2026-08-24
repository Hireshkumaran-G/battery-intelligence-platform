import React from 'react';
import clsx from 'clsx';
import {
  Layers,
  Zap,
  GitCompare,
  BrainCircuit,
  Search,
  Database,
  CircuitBoard,
  ChevronLeft,
  ChevronRight,
  Activity,
  Cpu,
} from 'lucide-react';
import { useAppStore, SectionId } from '../../store/useAppStore';

interface NavItem {
  id: SectionId;
  label: string;
  sublabel: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  activeBorderColor: string;
  activeDotColor: string;
}

interface NavGroup {
  groupName: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    groupName: 'ANALYSIS',
    items: [
      {
        id: 'degradation',
        label: 'Degradation & Lifespan',
        sublabel: 'Cycle envelope & bounds',
        icon: Layers,
        accentColor: 'text-[var(--accent-thermal)]',
        activeBorderColor: 'border-l-[var(--accent-thermal)]',
        activeDotColor: 'bg-[var(--accent-thermal)]',
      },
      {
        id: 'dynamic-signatures',
        label: 'Dynamic Signatures',
        sublabel: 'Sign reversal & SNR curves',
        icon: Zap,
        accentColor: 'text-[var(--accent-ripple)]',
        activeBorderColor: 'border-l-[var(--accent-ripple)]',
        activeDotColor: 'bg-[var(--accent-ripple)]',
      },
      {
        id: 'cross-chemistry',
        label: 'Cross-Chemistry',
        sublabel: 'LOCO transfer error matrix',
        icon: GitCompare,
        accentColor: 'text-[var(--accent-current)]',
        activeBorderColor: 'border-l-[var(--accent-current)]',
        activeDotColor: 'bg-[var(--accent-current)]',
      },
      {
        id: 'model-intelligence',
        label: 'Model Intelligence',
        sublabel: '3-Strategy & feature weights',
        icon: BrainCircuit,
        accentColor: 'text-[var(--accent-model)]',
        activeBorderColor: 'border-l-[var(--accent-model)]',
        activeDotColor: 'bg-[var(--accent-model)]',
      },
      {
        id: 'cell-inspector',
        label: 'Cell Deep-Dive',
        sublabel: 'Multi-degree sensitivity',
        icon: Search,
        accentColor: 'text-[var(--accent-healthy)]',
        activeBorderColor: 'border-l-[var(--accent-healthy)]',
        activeDotColor: 'bg-[var(--accent-healthy)]',
      },
    ],
  },
  {
    groupName: 'EVIDENCE',
    items: [
      {
        id: 'artifacts',
        label: 'Research Artifacts',
        sublabel: '11 verified CSV datasets',
        icon: Database,
        accentColor: 'text-[var(--text-secondary)]',
        activeBorderColor: 'border-l-[var(--text-secondary)]',
        activeDotColor: 'bg-[var(--text-secondary)]',
      },
      {
        id: 'deployment',
        label: 'STM32 Deployment',
        sublabel: 'Exported C TinyML packages',
        icon: CircuitBoard,
        accentColor: 'text-[var(--accent-model)]',
        activeBorderColor: 'border-l-[var(--accent-model)]',
        activeDotColor: 'bg-[var(--accent-model)]',
      },
    ],
  },
];

export const Sidebar: React.FC = () => {
  const { activeSection, setActiveSection, isSidebarCollapsed, toggleSidebar } = useAppStore();

  const handleNavClick = (sectionId: SectionId) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      const yOffset = -68;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <aside
      className={clsx(
        'bg-[var(--bg-sidebar)] border-r border-[var(--border-main)] flex flex-col justify-between select-none transition-all duration-200 shrink-0 sticky top-[54px] self-start z-20',
        isSidebarCollapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Top Header & Collapse Toggle */}
      <div>
        <div className="h-11 px-3.5 border-b border-[var(--border-main)] flex items-center justify-between bg-[var(--bg-sidebar-header)] transition-colors duration-150">
          {!isSidebarCollapsed && (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-6 h-6 rounded bg-[var(--bg-panel)] border border-[var(--border-main)] flex items-center justify-center text-[var(--accent-ripple)] shrink-0">
                <Activity className="w-3.5 h-3.5" />
              </div>
              <div className="truncate">
                <span className="font-mono font-bold text-xs tracking-wider text-[var(--text-primary)] block truncate">
                  NAVIGATION
                </span>
              </div>
            </div>
          )}

          {isSidebarCollapsed && (
            <div className="w-full flex justify-center">
              <div className="w-6 h-6 rounded bg-[var(--bg-panel)] border border-[var(--border-main)] flex items-center justify-center text-[var(--accent-ripple)]">
                <Activity className="w-3.5 h-3.5" />
              </div>
            </div>
          )}

          <button
            onClick={toggleSidebar}
            title={isSidebarCollapsed ? 'Expand Navigation' : 'Collapse Navigation'}
            className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-panel)] transition-colors cursor-pointer"
          >
            {isSidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Navigation Group Sections */}
        <div className="py-2.5 px-2 space-y-3">
          {NAV_GROUPS.map((group) => (
            <div key={group.groupName} className="space-y-1">
              {!isSidebarCollapsed && (
                <div className="px-2.5 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  {group.groupName}
                </div>
              )}

              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    title={isSidebarCollapsed ? `${item.label} (${item.sublabel})` : undefined}
                    className={clsx(
                      'w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded text-xs font-medium transition-all group relative border cursor-pointer',
                      isActive
                        ? `bg-[var(--bg-panel)] text-[var(--text-primary)] border-[var(--border-main)] border-l-2 ${item.activeBorderColor} shadow-sm font-semibold`
                        : 'border-transparent text-[var(--text-muted)] hover:bg-[var(--bg-panel)]/80 hover:text-[var(--text-primary)]'
                    )}
                  >
                    <Icon
                      className={clsx(
                        'w-4 h-4 shrink-0 transition-colors',
                        isActive ? item.accentColor : 'text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]'
                      )}
                    />

                    {!isSidebarCollapsed && (
                      <div className="text-left truncate min-w-0">
                        <div className="font-sans text-xs truncate leading-snug">{item.label}</div>
                        <div className="text-[10px] font-mono text-[var(--text-muted)] truncate leading-none mt-0.5">
                          {item.sublabel}
                        </div>
                      </div>
                    )}

                    {isActive && (
                      <span
                        className={clsx(
                          'absolute right-2 w-1.5 h-1.5 rounded-full animate-pulse',
                          item.activeDotColor
                        )}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Target Microcontroller Status Tile at Bottom */}
      <div className="p-2.5 border-t border-[var(--border-main)] bg-[var(--bg-sidebar-header)] mt-3">
        {!isSidebarCollapsed ? (
          <div className="p-2 rounded bg-[var(--bg-panel)] border border-[var(--border-sub)] space-y-1 text-[11px] font-mono">
            <div className="flex items-center justify-between text-[var(--text-muted)]">
              <span className="text-[10px]">TARGET:</span>
              <span className="text-[var(--accent-model)] font-semibold">STM32F446RE</span>
            </div>
            <div className="flex items-center justify-between text-[var(--text-muted)]">
              <span className="text-[10px]">SYSTEM:</span>
              <span className="text-[var(--accent-healthy)] flex items-center gap-1 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-healthy)]" />
                ONLINE
              </span>
            </div>
          </div>
        ) : (
          <div className="flex justify-center p-1" title="Target MCU: STM32F446RE (Online)">
            <Cpu className="w-4 h-4 text-[var(--accent-model)]" />
          </div>
        )}
      </div>
    </aside>
  );
};
