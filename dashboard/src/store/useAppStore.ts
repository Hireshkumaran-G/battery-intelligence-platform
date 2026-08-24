import { create } from 'zustand';

export type ChemistryFilter = 'ALL' | 'LFP' | 'NMC' | 'LCO';

export type SectionId =
  | 'overview-summary'
  | 'degradation'
  | 'dynamic-signatures'
  | 'cross-chemistry'
  | 'model-intelligence'
  | 'cell-inspector'
  | 'artifacts'
  | 'deployment';

export type ThemeMode = 'dark' | 'light';

interface AppState {
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
  activeSection: 'degradation',
  setActiveSection: (section) => set({ activeSection: section }),
  selectedChemistry: 'ALL',
  setSelectedChemistry: (chem) => set({ selectedChemistry: chem }),
  selectedCellId: 'LFP_Cell_0',
  setSelectedCellId: (cellId) => set({ selectedCellId: cellId }),
  selectedArtifactId: 'cell_correlation_audit',
  setSelectedArtifactId: (id) => set({ selectedArtifactId: id }),
}));
