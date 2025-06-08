
// src/contexts/RecentActivityContext.tsx
'use client';

import type { ContinueWatchingItem } from '@/types';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { createContext, useState, useContext, useCallback } from 'react';

interface RecentActivityContextState {
  mostRecentItem: ContinueWatchingItem | null;
  updateMostRecentItem: (item: ContinueWatchingItem | null) => void;
}

const RecentActivityContext = createContext<RecentActivityContextState | undefined>(undefined);

export function RecentActivityProvider({ children }: { children: ReactNode }) {
  const [mostRecentItem, setMostRecentItem] = useState<ContinueWatchingItem | null>(null);

  const updateMostRecentItem = useCallback((item: ContinueWatchingItem | null) => {
    setMostRecentItem(item);
  }, []);

  return (
    <RecentActivityContext.Provider value={{ mostRecentItem, updateMostRecentItem }}>
      {children}
    </RecentActivityContext.Provider>
  );
}

export function useRecentActivity() {
  const context = useContext(RecentActivityContext);
  if (context === undefined) {
    throw new Error('useRecentActivity must be used within a RecentActivityProvider');
  }
  return context;
}
