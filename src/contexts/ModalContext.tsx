
'use client';

import type { StoredCineItem } from '@/types';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { createContext, useState, useContext } from 'react';

interface ModalContextState {
  selectedItem: (StoredCineItem & { _playActionData?: { seasonNumber: number; episodeIndex: number } }) | null;
  setSelectedItem: Dispatch<SetStateAction<(StoredCineItem & { _playActionData?: { seasonNumber: number; episodeIndex: number } }) | null>>;
  initialModalAction: 'play' | null;
  setInitialModalAction: Dispatch<SetStateAction<'play' | null>>;
  isModalOpen: boolean;
  openModal: (item: StoredCineItem & { _playActionData?: { seasonNumber: number; episodeIndex: number } }, action?: 'play' | null) => void;
  closeModal: () => void;
  onInitialActionConsumed: () => void;
}

const ModalContext = createContext<ModalContextState | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [selectedItem, setSelectedItem] = useState<(StoredCineItem & { _playActionData?: { seasonNumber: number; episodeIndex: number } }) | null>(null);
  const [initialModalAction, setInitialModalAction] = useState<'play' | null>(null);

  const openModal = (item: StoredCineItem & { _playActionData?: { seasonNumber: number; episodeIndex: number } }, action: 'play' | null = null) => {
    setSelectedItem(item);
    setInitialModalAction(action);
  };

  const closeModal = () => {
    setSelectedItem(null);
    setInitialModalAction(null);
  };

  const onInitialActionConsumed = () => {
    setInitialModalAction(null);
  };

  const isModalOpen = !!selectedItem;

  return (
    <ModalContext.Provider value={{ 
      selectedItem, 
      setSelectedItem, 
      initialModalAction, 
      setInitialModalAction,
      isModalOpen,
      openModal,
      closeModal,
      onInitialActionConsumed
    }}>
      {children}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}
