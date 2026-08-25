/**
 * App.tsx
 *
 * Root Application Router for Battery Intelligence Platform.
 * Routes currentWorkspace and activeSection to 100% distinct, non-duplicate feature components.
 */
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout } from './components/layout/AppLayout';
import { useAppStore } from './store/useAppStore';

// Research Workspace Pages
import { ResearchOverviewPage } from './features/overview/ResearchOverviewPage';
import { DegradationLifecyclePage } from './features/overview/DegradationLifecyclePage';
import { DynamicSignaturesPage } from './features/overview/DynamicSignaturesPage';
import { CrossChemistryPage } from './features/overview/CrossChemistryPage';
import { ModelIntelligencePage } from './features/overview/ModelIntelligencePage';
import { CellDeepDivePage } from './features/overview/CellDeepDivePage';
import { ResearchArtifactsPage } from './features/overview/ResearchArtifactsPage';
import { ResearchValidationPage } from './features/overview/ResearchValidationPage';
import { DeploymentEvidencePage } from './features/overview/DeploymentEvidencePage';

// Live Tracking Workspace Pages
import { LiveOverviewPage } from './features/live-hardware/LiveOverviewPage';
import { LiveHardwarePage } from './features/live-hardware/LiveHardwarePage';
import { LiveSignalsPage } from './features/live-hardware/LiveSignalsPage';
import { HardwareDeploymentPage } from './features/live-hardware/HardwareDeploymentPage';
import { LiveDiagnosticsPage } from './features/live-hardware/LiveDiagnosticsPage';

// Grid Operations Workspace Pages
import { CommandCenterPage } from './features/command-center/CommandCenterPage';
import { FleetSurveillancePage } from './features/surveillance/FleetSurveillancePage';
import { AnomalyCenterPage } from './features/surveillance/AnomalyCenterPage';
import { GridEventsPage } from './features/surveillance/GridEventsPage';
import { BatteryHealthPage } from './features/surveillance/BatteryHealthPage';
import { DegradationForecastPage } from './features/surveillance/DegradationForecastPage';
import { GridCrossChemPage } from './features/surveillance/GridCrossChemPage';
import { BessFleetAssetsPage } from './features/surveillance/BessFleetAssetsPage';
import { AssetDetailsPage } from './features/surveillance/AssetDetailsPage';
import { MaintenancePrioritiesPage } from './features/surveillance/MaintenancePrioritiesPage';
import { OperatorRecommendationsPage } from './features/surveillance/OperatorRecommendationsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes cache
      retry: 1,
    },
  },
});

const DashboardContent: React.FC = () => {
  const currentWorkspace = useAppStore((state) => state.currentWorkspace);
  const activeSection = useAppStore((state) => state.activeSection);

  const renderContent = () => {
    // 1. RESEARCH WORKSPACE
    if (currentWorkspace === 'research') {
      switch (activeSection) {
        case 'degradation':
          return <DegradationLifecyclePage />;
        case 'dynamic-signatures':
          return <DynamicSignaturesPage />;
        case 'cross-chemistry':
          return <CrossChemistryPage />;
        case 'model-intelligence':
          return <ModelIntelligencePage />;
        case 'cell-inspector':
          return <CellDeepDivePage />;
        case 'artifacts':
          return <ResearchArtifactsPage />;
        case 'validation':
          return <ResearchValidationPage />;
        case 'deployment':
          return <DeploymentEvidencePage />;
        case 'research-overview':
        default:
          return <ResearchOverviewPage />;
      }
    }

    // 2. LIVE TRACKING WORKSPACE
    if (currentWorkspace === 'live') {
      switch (activeSection) {
        case 'live-overview':
          return <LiveOverviewPage />;
        case 'live-signals':
        case 'live-vitals':
        case 'live-ripple':
        case 'live-spectral':
        case 'live-kinetics':
          return <LiveSignalsPage />;
        case 'live-hardware-deployment':
        case 'live-stm32':
        case 'live-mcu-status':
          return <HardwareDeploymentPage />;
        case 'live-diagnostics':
        case 'live-sequence':
          return <LiveDiagnosticsPage />;
        case 'live-hardware':
        default:
          return <LiveHardwarePage />;
      }
    }

    // 3. GRID OPERATIONS WORKSPACE
    switch (activeSection) {
      case 'fleet':
        return <FleetSurveillancePage />;
      case 'anomaly-center':
        return <AnomalyCenterPage />;
      case 'grid-events':
        return <GridEventsPage />;
      case 'grid-degradation':
        return <BatteryHealthPage />;
      case 'grid-forecast':
      case 'grid-soh-rul':
        return <DegradationForecastPage />;
      case 'grid-cross-chem':
        return <GridCrossChemPage />;
      case 'grid-fleet-assets':
        return <BessFleetAssetsPage />;
      case 'grid-asset-details':
        return <AssetDetailsPage />;
      case 'grid-maintenance':
        return <MaintenancePrioritiesPage />;
      case 'grid-recommendations':
        return <OperatorRecommendationsPage />;
      case 'command-center':
      default:
        return <CommandCenterPage />;
    }
  };

  return (
    <div key={`${currentWorkspace}-${activeSection}`} className="page-transition min-h-full">
      {renderContent()}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AppLayout>
        <DashboardContent />
      </AppLayout>
    </QueryClientProvider>
  );
};

export default App;
