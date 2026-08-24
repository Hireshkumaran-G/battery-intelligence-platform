import React, { useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useAppStore, SectionId } from '../../store/useAppStore';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { setActiveSection } = useAppStore();

  useEffect(() => {
    const sectionIds: SectionId[] = [
      'degradation',
      'dynamic-signatures',
      'cross-chemistry',
      'model-intelligence',
      'cell-inspector',
      'artifacts',
      'deployment',
    ];

    let isTicking = false;

    const handleScroll = () => {
      if (isTicking) return;
      isTicking = true;
      requestAnimationFrame(() => {
        isTicking = false;
        const scrollY = window.scrollY || window.pageYOffset;
        const windowHeight = window.innerHeight;
        const docHeight = document.documentElement.scrollHeight;

        // Bottom detection: if user scrolled near the bottom of the page, activate STM32 Deployment
        if (scrollY + windowHeight >= docHeight - 90) {
          setActiveSection('deployment');
          return;
        }

        // Top detection: if user is at the very top, activate first section
        if (scrollY < 180) {
          setActiveSection('degradation');
          return;
        }

        // Target trigger offset from viewport top
        const triggerY = 220;
        let matchedSection: SectionId = 'degradation';

        for (let i = 0; i < sectionIds.length; i++) {
          const id = sectionIds[i];
          const el = document.getElementById(id);
          if (el) {
            const rect = el.getBoundingClientRect();
            if (rect.top <= triggerY) {
              matchedSection = id;
            }
          }
        }

        setActiveSection(matchedSection);
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });

    // Initial check on load
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [setActiveSection]);

  return (
    <div className="min-h-screen bg-[var(--bg-root)] text-[var(--text-primary)] transition-colors duration-150 flex flex-col">
      {/* Top Application Header (Sticky at top of viewport) */}
      <Topbar />

      {/* Main Document Layout: Sticky Sidebar + Main Workspace scroll naturally */}
      <div className="flex-1 flex w-full">
        <Sidebar />
        <main className="flex-1 min-w-0 p-4 sm:p-5 lg:p-6 space-y-6 max-w-[1600px] mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
