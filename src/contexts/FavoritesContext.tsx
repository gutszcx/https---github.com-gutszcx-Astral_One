
// src/contexts/FavoritesContext.tsx
'use client';

import type { StoredCineItem } from '@/types';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface FavoritesContextState {
  favoriteIds: string[];
  addFavorite: (item: StoredCineItem) => void;
  removeFavorite: (itemId: string) => void;
  isFavorite: (itemId: string) => boolean;
  toggleFavorite: (item: StoredCineItem) => void;
}

const FavoritesContext = createContext<FavoritesContextState | undefined>(undefined);

const FAVORITES_STORAGE_KEY = 'cineform-favorites';

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedFavorites = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (storedFavorites) {
        setFavoriteIds(JSON.parse(storedFavorites));
      }
    } catch (error) {
        console.error("Error loading favorites from localStorage:", error);
        // Initialize with empty array if localStorage is corrupt or unavailable
        setFavoriteIds([]);
    }
  }, []);

  const saveFavorites = useCallback((ids: string[]) => {
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(ids));
    } catch (error) {
        console.error("Error saving favorites to localStorage:", error);
        toast({
            title: "Erro ao Salvar Favoritos",
            description: "Não foi possível salvar suas preferências localmente.",
            variant: "destructive",
        });
    }
  }, [toast]);

  const addFavorite = useCallback((item: StoredCineItem) => {
    setFavoriteIds((prevIds) => {
      if (prevIds.includes(item.id)) return prevIds;
      const newIds = [...prevIds, item.id];
      saveFavorites(newIds);
      toast({
        title: "Adicionado aos Favoritos!",
        description: `"${item.tituloOriginal}" foi adicionado à sua lista.`,
      });
      return newIds;
    });
  }, [saveFavorites, toast]);

  const removeFavorite = useCallback((itemId: string, itemTitle?: string) => {
    setFavoriteIds((prevIds) => {
      if (!prevIds.includes(itemId)) return prevIds;
      const newIds = prevIds.filter(id => id !== itemId);
      saveFavorites(newIds);
      toast({
        title: "Removido dos Favoritos",
        description: itemTitle ? `"${itemTitle}" foi removido da sua lista.` : "Item removido da sua lista.",
      });
      return newIds;
    });
  }, [saveFavorites, toast]);

  const isFavorite = useCallback((itemId: string) => {
    return favoriteIds.includes(itemId);
  }, [favoriteIds]);

  const toggleFavorite = useCallback((item: StoredCineItem) => {
    if (isFavorite(item.id)) {
      removeFavorite(item.id, item.tituloOriginal);
    } else {
      addFavorite(item);
    }
  }, [addFavorite, isFavorite, removeFavorite]);

  return (
    <FavoritesContext.Provider value={{ 
      favoriteIds, 
      addFavorite,
      removeFavorite,
      isFavorite,
      toggleFavorite
    }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
