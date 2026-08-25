/**
 * AppLayout.tsx
 *
 * Core App Shell Layout for Battery Intelligence Platform.
 * Enforces independent scroll architecture:
 * - Fixed Topbar (54px)
 * - Fixed/Independent Sidebar Scroll Container
 * - Independent Main Content Scroll Container (#main-content-scroll)
 * - Workspace Scroll Position Persistence
 */
import React, { useEffect, useRef } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useAppStore } from '../../store/useAppStore';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const currentWorkspace = useAppStore((state) => state.currentWorkspace);
  const saveWorkspaceScrollPosition = useAppStore((state) => state.saveWorkspaceScrollPosition);
  const workspaceScrollPositions = useAppStore((state) => state.workspaceScrollPositions);

  const mainContentRef = useRef<HTMLElement>(null);
  const prevWorkspaceRef = useRef(currentWorkspace);

  // Restore scroll position when workspace changes
  useEffect(() => {
    const mainEl = mainContentRef.current;
    if (!mainEl) return;

    // Save previous workspace scroll position
    if (prevWorkspaceRef.current !== currentWorkspace) {
      saveWorkspaceScrollPosition(prevWorkspaceRef.current, mainEl.scrollTop);
      prevWorkspaceRef.current = currentWorkspace;

      // Restore new workspace scroll position
      const savedPos = workspaceScrollPositions[currentWorkspace] || 0;
      requestAnimationFrame(() => {
        mainEl.scrollTop = savedPos;
      });
    }
  }, [currentWorkspace, saveWorkspaceScrollPosition, workspaceScrollPositions]);

  // Track main content scroll position
  const handleMainScroll = () => {
    if (mainContentRef.current) {
      saveWorkspaceScrollPosition(currentWorkspace, mainContentRef.current.scrollTop);
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-[var(--bg-root)] text-[var(--text-primary)] transition-colors duration-150 flex flex-col">
      {/* 1. TOPBAR (Fixed height 54px) */}
      <Topbar />

      {/* 2. APPLICATION BODY (Fixed height calc(100vh - 54px)) */}
      <div className="flex-1 flex w-full min-h-0 h-[calc(100vh-54px)] overflow-hidden">
        {/* INDEPENDENT SIDEBAR */}
        <Sidebar />

        {/* INDEPENDENT MAIN CONTENT SCROLL CONTAINER */}
        <main
          id="main-content-scroll"
          ref={mainContentRef}
          onScroll={handleMainScroll}
          className="main-content flex-1 min-w-0 min-h-0 h-full overflow-y-auto overscroll-contain p-4 sm:p-5 lg:p-6 space-y-6 max-w-[1600px] mx-auto"
        >
          {children}
        </main>
      </div>
    </div>
  );
};
