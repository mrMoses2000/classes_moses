import React, { useState, useEffect, useCallback } from 'react';
import { LandingPage } from './components/LandingPage';
import { Workshop } from './components/Workshop';

export type CurrentView = 'landing' | 'workshop';

function detectViewFromUrl(): CurrentView {
  if (typeof window === 'undefined') return 'landing';

  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();

  // Support /workshop, /lesson-1, and hash equivalents
  if (
    path.includes('/workshop') ||
    path.includes('/lesson-1') ||
    hash.includes('/workshop') ||
    hash.includes('/lesson-1')
  ) {
    return 'workshop';
  }

  return 'landing';
}

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<CurrentView>(detectViewFromUrl);

  const navigateTo = useCallback((view: CurrentView) => {
    setCurrentView(view);
    const targetUrl = view === 'workshop' ? '/workshop' : '/';
    if (window.location.pathname !== targetUrl) {
      window.history.pushState({ view }, '', targetUrl);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Sync with browser back/forward and hash changes
  useEffect(() => {
    const handlePopState = () => {
      setCurrentView(detectViewFromUrl());
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  // Update document title dynamically
  useEffect(() => {
    if (currentView === 'workshop') {
      document.title = 'Робот и код — Мастерская первого занятия: Доставь робота к маяку';
    } else {
      document.title = 'Робот и код — Очный курс программирования для 4 класса';
    }
  }, [currentView]);

  if (currentView === 'workshop') {
    return <Workshop onGoToHome={() => navigateTo('landing')} />;
  }

  return <LandingPage onGoToWorkshop={() => navigateTo('workshop')} />;
};
