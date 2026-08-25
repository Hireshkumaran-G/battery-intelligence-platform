/**
 * Sidebar.tsx
 *
 * Independently scrollable navigation panel for Battery Intelligence Platform.
 * Supports 3 workspaces: RESEARCH, LIVE TRACKING, GRID OPERATIONS.
 * Enforces 1-to-1 unique purpose mapping for all navigation items.
 */
import React, { useEffect, useRef } from 'react';
import clsx from 'clsx';
import {
  ShieldAlert,
  Grid,
  Layers,
  Zap,
  GitCompare,
  Database,
  CircuitBoard,
  ChevronLeft,
  ChevronRight,
  Activity,
  BarChart2,
  BrainCircuit,
  Search,
  CheckCircle,
  Clock,
  Cpu,
  Radio,
  Wrench,
  ShieldCheck,
  Lightbulb,
  HardDrive,
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

// 1. RESEARCH WORKSPACE NAV GROUPS
const RESEARCH_NAV_GROUPS: NavGroup[] = [
  {
    groupName: 'OVERVIEW',
    items: [
      {
        id: 'research-overview',
        label: 'Research Overview',
        sublabel: 'Dataset scope & scientific summary',
        icon: Grid,
        accentColor: 'text-[var(--accent-voltage)]',
        activeBorderColor: 'border-l-[var(--accent-voltage)]',
        activeDotColor: 'bg-[var(--accent-voltage)]',
      },
    ],
  },
  {
    groupName: 'ANALYSIS',
    items: [
      {
        id: 'degradation',
        label: 'Degradation & Lifecycle',
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
        id: 'validation',
        label: 'Validation Results',
        sublabel: 'Statistical significance & RMSE',
        icon: CheckCircle,
        accentColor: 'text-[var(--accent-healthy)]',
        activeBorderColor: 'border-l-[var(--accent-healthy)]',
        activeDotColor: 'bg-[var(--accent-healthy)]',
      },
      {
        id: 'deployment',
        label: 'Deployment Evidence',
        sublabel: 'Exported C TinyML packages',
        icon: CircuitBoard,
        accentColor: 'text-[var(--accent-model)]',
        activeBorderColor: 'border-l-[var(--accent-model)]',
        activeDotColor: 'bg-[var(--accent-model)]',
      },
    ],
  },
];

// 2. LIVE TRACKING WORKSPACE NAV GROUPS
const LIVE_NAV_GROUPS: NavGroup[] = [
  {
    groupName: 'OVERVIEW',
    items: [
      {
        id: 'live-overview',
        label: 'Live Tracking Overview',
        sublabel: 'Acquisition stream stats',
        icon: Activity,
        accentColor: 'text-[var(--accent-live)]',
        activeBorderColor: 'border-l-[var(--accent-live)]',
        activeDotColor: 'bg-[var(--accent-live)]',
      },
    ],
  },
  {
    groupName: 'TELEMETRY',
    items: [
      {
        id: 'live-hardware',
        label: 'Live Hardware Stream',
        sublabel: 'WebSocket real-time telemetry',
        icon: Radio,
        accentColor: 'text-[var(--accent-live)]',
        activeBorderColor: 'border-l-[var(--accent-live)]',
        activeDotColor: 'bg-[var(--accent-live)]',
      },
    ],
  },
  {
    groupName: 'SIGNALS',
    items: [
      {
        id: 'live-signals',
        label: 'Signal Analysis',
        sublabel: 'Vitals, Ripple, FFT & dV/dt',
        icon: Zap,
        accentColor: 'text-[var(--accent-ripple)]',
        activeBorderColor: 'border-l-[var(--accent-ripple)]',
        activeDotColor: 'bg-[var(--accent-ripple)]',
      },
    ],
  },
  {
    groupName: 'HARDWARE',
    items: [
      {
        id: 'live-hardware-deployment',
        label: 'Hardware Deployment',
        sublabel: 'Target MCU & integration seam',
        icon: Cpu,
        accentColor: 'text-[var(--accent-model)]',
        activeBorderColor: 'border-l-[var(--accent-model)]',
        activeDotColor: 'bg-[var(--accent-model)]',
      },
    ],
  },
  {
    groupName: 'DIAGNOSTICS',
    items: [
      {
        id: 'live-diagnostics',
        label: 'Connection Diagnostics',
        sublabel: 'Packet health & ring buffer debug',
        icon: Radio,
        accentColor: 'text-[var(--accent-live)]',
        activeBorderColor: 'border-l-[var(--accent-live)]',
        activeDotColor: 'bg-[var(--accent-live)]',
      },
    ],
  },
];

// 3. GRID OPERATIONS WORKSPACE NAV GROUPS
const GRID_NAV_GROUPS: NavGroup[] = [
  {
    groupName: 'OVERVIEW',
    items: [
      {
        id: 'command-center',
        label: 'Command Center',
        sublabel: 'BESS operational status summary',
        icon: Grid,
        accentColor: 'text-[var(--accent-live)]',
        activeBorderColor: 'border-l-[var(--accent-live)]',
        activeDotColor: 'bg-[var(--accent-live)]',
      },
    ],
  },
  {
    groupName: 'SURVEILLANCE',
    items: [
      {
        id: 'fleet',
        label: 'Fleet Monitoring',
        sublabel: 'Asset matrix & status table',
        icon: BarChart2,
        accentColor: 'text-[var(--accent-voltage)]',
        activeBorderColor: 'border-l-[var(--accent-voltage)]',
        activeDotColor: 'bg-[var(--accent-voltage)]',
      },
      {
        id: 'anomaly-center',
        label: 'Anomaly Center',
        sublabel: 'Active actionable alerts',
        icon: ShieldAlert,
        accentColor: 'text-[var(--accent-thermal)]',
        activeBorderColor: 'border-l-[var(--accent-thermal)]',
        activeDotColor: 'bg-[var(--accent-thermal)]',
      },
    ],
  },
  {
    groupName: 'EVENTS',
    items: [
      {
        id: 'grid-events',
        label: 'Alerts & Events',
        sublabel: 'Chronological audit feed',
        icon: Clock,
        accentColor: 'text-[var(--accent-current)]',
        activeBorderColor: 'border-l-[var(--accent-current)]',
        activeDotColor: 'bg-[var(--accent-current)]',
      },
    ],
  },
  {
    groupName: 'ANALYTICS',
    items: [
      {
        id: 'grid-degradation',
        label: 'Battery Health',
        sublabel: 'Capacity fade & cell balance',
        icon: Layers,
        accentColor: 'text-[var(--accent-thermal)]',
        activeBorderColor: 'border-l-[var(--accent-thermal)]',
        activeDotColor: 'bg-[var(--accent-thermal)]',
      },
      {
        id: 'grid-forecast',
        label: 'Degradation Forecast',
        sublabel: 'RUL trajectory & EOL bounds',
        icon: BrainCircuit,
        accentColor: 'text-[var(--accent-model)]',
        activeBorderColor: 'border-l-[var(--accent-model)]',
        activeDotColor: 'bg-[var(--accent-model)]',
      },
      {
        id: 'grid-cross-chem',
        label: 'Cross-Chemistry Intelligence',
        sublabel: 'LFP vs NMC vs LCO audit',
        icon: GitCompare,
        accentColor: 'text-[var(--accent-current)]',
        activeBorderColor: 'border-l-[var(--accent-current)]',
        activeDotColor: 'bg-[var(--accent-current)]',
      },
    ],
  },
  {
    groupName: 'ASSETS',
    items: [
      {
        id: 'grid-fleet-assets',
        label: 'BESS Fleet',
        sublabel: 'Site & pack directory',
        icon: ShieldCheck,
        accentColor: 'text-[var(--accent-healthy)]',
        activeBorderColor: 'border-l-[var(--accent-healthy)]',
        activeDotColor: 'bg-[var(--accent-healthy)]',
      },
      {
        id: 'grid-asset-details',
        label: 'Asset Details',
        sublabel: 'Single pack deep dive',
        icon: HardDrive,
        accentColor: 'text-[var(--accent-voltage)]',
        activeBorderColor: 'border-l-[var(--accent-voltage)]',
        activeDotColor: 'bg-[var(--accent-voltage)]',
      },
    ],
  },
  {
    groupName: 'OPERATIONS',
    items: [
      {
        id: 'grid-maintenance',
        label: 'Maintenance Priorities',
        sublabel: 'Ranked risk queue',
        icon: Wrench,
        accentColor: 'text-rose-500',
        activeBorderColor: 'border-l-rose-500',
        activeDotColor: 'bg-rose-500',
      },
      {
        id: 'grid-recommendations',
        label: 'Recommendations',
        sublabel: 'Dispatcher mitigation guidance',
        icon: Lightbulb,
        accentColor: 'text-[var(--accent-healthy)]',
        activeBorderColor: 'border-l-[var(--accent-healthy)]',
        activeDotColor: 'bg-[var(--accent-healthy)]',
      },
    ],
  },
];

export const Sidebar: React.FC = () => {
  const currentWorkspace = useAppStore((state) => state.currentWorkspace);
  const activeSection = useAppStore((state) => state.activeSection);
  const isSidebarCollapsed = useAppStore((state) => state.isSidebarCollapsed);
  const setActiveSection = useAppStore((state) => state.setActiveSection);
  const setSidebarCollapsed = useAppStore((state) => state.setSidebarCollapsed);

  const navContainerRef = useRef<HTMLDivElement>(null);
  const activeBtnRef = useRef<HTMLButtonElement>(null);

  // Select groups based on workspace
  let currentNavGroups = RESEARCH_NAV_GROUPS;
  if (currentWorkspace === 'live') currentNavGroups = LIVE_NAV_GROUPS;
  if (currentWorkspace === 'grid') currentNavGroups = GRID_NAV_GROUPS;

  // Auto-scroll active nav item into view
  useEffect(() => {
    if (activeBtnRef.current) {
      activeBtnRef.current.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [activeSection, currentWorkspace]);

  const handleNavClick = (id: SectionId) => {
    setActiveSection(id);

    // Scroll main content scroll container to top if changing view
    const mainContentEl = document.getElementById('main-content-scroll');
    if (mainContentEl) {
      mainContentEl.scrollTop = 0;
    }
  };

  return (
    <aside
      className={clsx(
        'h-full flex flex-col bg-[var(--bg-sidebar)] border-r border-[var(--border-main)] transition-all duration-200 select-none shrink-0 overflow-hidden z-20',
        isSidebarCollapsed ? 'w-[60px]' : 'w-[250px]'
      )}
    >
      {/* Sidebar Header */}
      <div className="h-[46px] px-3.5 flex items-center justify-between border-b border-[var(--border-main)] bg-[var(--bg-sidebar-header)] shrink-0 font-mono text-xs">
        {!isSidebarCollapsed && (
          <span className="font-bold tracking-wider text-[var(--text-muted)] uppercase text-[10px]">
            {currentWorkspace === 'research' && 'RESEARCH WORKSPACE'}
            {currentWorkspace === 'live' && 'LIVE TRACKING'}
            {currentWorkspace === 'grid' && 'GRID OPERATIONS'}
          </span>
        )}
        <button
          onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
          title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          className={clsx(
            'p-1 rounded hover:bg-[var(--bg-panel)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer',
            isSidebarCollapsed && 'mx-auto'
          )}
        >
          {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* INDEPENDENT SIDEBAR SCROLL AREA */}
      <div
        ref={navContainerRef}
        className="sidebar-nav flex-1 overflow-y-auto overscroll-contain p-2 space-y-4"
      >
        {currentNavGroups.map((group) => (
          <div key={group.groupName} className="space-y-1">
            {!isSidebarCollapsed && (
              <div className="px-2.5 py-1 text-[10px] font-mono font-bold tracking-wider text-[var(--text-subtle)] uppercase">
                {group.groupName}
              </div>
            )}

            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = activeSection === item.id;
                const Icon = item.icon;

                return (
                  <button
                    key={item.id}
                    ref={isActive ? activeBtnRef : null}
                    onClick={() => handleNavClick(item.id)}
                    title={isSidebarCollapsed ? `${item.label} — ${item.sublabel}` : undefined}
                    className={clsx(
                      'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md font-mono text-xs text-left transition-all group cursor-pointer border-l-2',
                      isActive
                        ? clsx('bg-[var(--bg-panel)] text-[var(--text-primary)] font-bold shadow-xs', item.activeBorderColor)
                        : 'border-l-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-panel-sub)]'
                    )}
                  >
                    <Icon
                      className={clsx(
                        'w-4 h-4 shrink-0 transition-colors',
                        isActive ? item.accentColor : 'text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]'
                      )}
                    />

                    {!isSidebarCollapsed && (
                      <div className="min-w-0 flex-1 leading-tight">
                        <div className="truncate font-semibold">{item.label}</div>
                        <div className="text-[10px] font-sans text-[var(--text-subtle)] truncate">
                          {item.sublabel}
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Sidebar Footer Status */}
      <div className="p-2.5 border-t border-[var(--border-main)] bg-[var(--bg-sidebar-header)] shrink-0 font-mono text-[10px]">
        {!isSidebarCollapsed ? (
          <div className="flex items-center justify-between text-[var(--text-muted)]">
            <span>PLATFORM STATUS</span>
            <span className="text-[var(--accent-live)] font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-live)] animate-pulse" />
              ONLINE
            </span>
          </div>
        ) : (
          <div className="w-2 h-2 rounded-full bg-[var(--accent-live)] mx-auto animate-pulse" />
        )}
      </div>
    </aside>
  );
};
