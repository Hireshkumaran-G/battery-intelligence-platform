import { create } from 'zustand';

export type ChemistryFilter = 'ALL' | 'LFP' | 'NMC' | 'LCO';

export type DashboardMode = 'research' | 'live';

export type WorkspaceId = 'research' | 'live' | 'grid';

export type SectionId =
  // Research Workspace
  | 'research-overview'
  | 'degradation'
  | 'dynamic-signatures'
  | 'cross-chemistry'
  | 'model-intelligence'
  | 'cell-inspector'
  | 'artifacts'
  | 'validation'
  | 'deployment'
  // Live Tracking Workspace
  | 'live-overview'
  | 'live-hardware'
  | 'live-signals'
  | 'live-hardware-deployment'
  | 'live-vitals'
  | 'live-ripple'
  | 'live-spectral'
  | 'live-kinetics'
  | 'live-stm32'
  | 'live-mcu-status'
  | 'live-diagnostics'
  | 'live-sequence'
  // Grid Operations Workspace
  | 'command-center'
  | 'fleet'
  | 'anomaly-center'
  | 'grid-events'
  | 'grid-degradation'
  | 'grid-soh-rul'
  | 'grid-forecast'
  | 'grid-cross-chem'
  | 'grid-fleet-assets'
  | 'grid-asset-details'
  | 'grid-maintenance'
  | 'grid-recommendations'
  | 'grid-reports';

export type ThemeMode = 'dark' | 'light';

interface AppState {
  // Workspaces
  currentWorkspace: WorkspaceId;
  setWorkspace: (ws: WorkspaceId) => void;
  workspaceScrollPositions: Record<WorkspaceId, number>;
  saveWorkspaceScrollPosition: (ws: WorkspaceId, pos: number) => void;

  // Legacy mode mapping
  mode: DashboardMode;
  setMode: (mode: DashboardMode) => void;
  toggleMode: () => void;

  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  isSidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  activeSection: SectionId;
  setActiveSection: (section: SectionId) => void;
  selectedChemistry: ChemistryFilter;
  setSelectedChemistry: (chem: ChemistryFilter) => void;
  selectedCellId: string;
  setSelectedCellId: (cellId: string) => void;
  selectedArtifactId: string;
  setSelectedArtifactId: (id: string) => void;

  // Grid & BESS Operator additions
  selectedBessPack: string;
  setSelectedBessPack: (packId: string) => void;
  isOperatorModalOpen: boolean;
  setOperatorModalOpen: (open: boolean) => void;
  toggleOperatorModal: () => void;
  acknowledgedAlertIds: string[];
  acknowledgeAlert: (alertId: string) => void;
}

const getInitialTheme = (): ThemeMode => {
  if (typeof window === 'undefined') return 'dark';
  const saved = localStorage.getItem('bip_theme') as ThemeMode | null;
  if (saved === 'dark' || saved === 'light') {
    return saved;
  }
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
    return 'light';
  }
  return 'dark';
};

const applyThemeToDOM = (theme: ThemeMode) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
  } else {
    root.classList.add('light');
    root.classList.remove('dark');
  }
  root.setAttribute('data-theme', theme);
};

// Initial DOM sync on script load
if (typeof window !== 'undefined') {
  applyThemeToDOM(getInitialTheme());
}

const getInitialSidebarState = (): boolean => {
  if (typeof window === 'undefined') return false;
  const saved = localStorage.getItem('bip_sidebar_collapsed');
  if (saved !== null) {
    return saved === 'true';
  }
  return window.innerWidth < 1100;
};

export const useAppStore = create<AppState>((set) => ({
  currentWorkspace: 'research',
  workspaceScrollPositions: {
    research: 0,
    live: 0,
    grid: 0,
  },
  setWorkspace: (ws) => {
    const mode: DashboardMode = ws === 'live' ? 'live' : 'research';
    let defaultSection: SectionId = 'command-center';
    if (ws === 'research') defaultSection = 'research-overview';
    if (ws === 'live') defaultSection = 'live-hardware';
    if (ws === 'grid') defaultSection = 'command-center';

    set({
      currentWorkspace: ws,
      mode,
      activeSection: defaultSection,
    });
  },
  saveWorkspaceScrollPosition: (ws, pos) =>
    set((state) => ({
      workspaceScrollPositions: {
        ...state.workspaceScrollPositions,
        [ws]: pos,
      },
    })),

  mode: 'research',
  setMode: (mode) =>
    set({
      mode,
      currentWorkspace: mode === 'live' ? 'live' : 'research',
      activeSection: mode === 'live' ? 'live-hardware' : 'research-overview',
    }),
  toggleMode: () =>
    set((state) => {
      const nextMode = state.mode === 'research' ? 'live' : 'research';
      return {
        mode: nextMode,
        currentWorkspace: nextMode === 'live' ? 'live' : 'research',
        activeSection: nextMode === 'live' ? 'live-hardware' : 'research-overview',
      };
    }),
  theme: getInitialTheme(),
  setTheme: (theme) => {
    localStorage.setItem('bip_theme', theme);
    applyThemeToDOM(theme);
    set({ theme });
  },
  toggleTheme: () => {
    set((state) => {
      const nextTheme: ThemeMode = state.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('bip_theme', nextTheme);
      applyThemeToDOM(nextTheme);
      return { theme: nextTheme };
    });
  },
  isSidebarCollapsed: getInitialSidebarState(),
  setSidebarCollapsed: (collapsed) => {
    localStorage.setItem('bip_sidebar_collapsed', String(collapsed));
    set({ isSidebarCollapsed: collapsed });
  },
  toggleSidebar: () => {
    set((state) => {
      const next = !state.isSidebarCollapsed;
      localStorage.setItem('bip_sidebar_collapsed', String(next));
      return { isSidebarCollapsed: next };
    });
  },
  activeSection: 'research-overview',
  setActiveSection: (section) => set({ activeSection: section }),
  selectedChemistry: 'ALL',
  setSelectedChemistry: (chem) => set({ selectedChemistry: chem }),
  selectedCellId: 'LFP_Cell_0',
  setSelectedCellId: (cellId) => set({ selectedCellId: cellId }),
  selectedArtifactId: 'cell_correlation_audit',
  setSelectedArtifactId: (id) => set({ selectedArtifactId: id }),

  // Grid & BESS Operator additions
  selectedBessPack: 'Pack-01',
  setSelectedBessPack: (packId) => set({ selectedBessPack: packId }),
  isOperatorModalOpen: false,
  setOperatorModalOpen: (open) => set({ isOperatorModalOpen: open }),
  toggleOperatorModal: () => set((state) => ({ isOperatorModalOpen: !state.isOperatorModalOpen })),
  acknowledgedAlertIds: [],
  acknowledgeAlert: (alertId) =>
    set((state) => ({
      acknowledgedAlertIds: state.acknowledgedAlertIds.includes(alertId)
        ? state.acknowledgedAlertIds
        : [...state.acknowledgedAlertIds, alertId],
    })),
}));
