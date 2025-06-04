
// src/app/page.tsx (HomeAni Homepage - Netflix Style Genre Rows)
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getContentItems } from '@/lib/firebaseService';
import type { StoredCineItem } from '@/types';
import { HomeAniContentCard } from '@/components/homeani/HomeAniContentCard';
import { HomeAniDetailModal } from '@/components/homeani/HomeAniDetailModal';
import { HomeAniHeroCard } from '@/components/homeani/HomeAniHeroCard';
import { Loader2, AlertTriangle, Flame, Tag, PlaySquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface ProgressData {
  time: number;
  duration: number;
  lastSaved: number;
}

interface ContinueWatchingItem extends StoredCineItem {
  lastSaved: number;
  progressTime?: number;
  progressDuration?: number;
}

export default function HomeAniPage() {
  const [selectedItem, setSelectedItem] = useState<StoredCineItem | null>(null);
  const [continueWatchingItems, setContinueWatchingItems] = useState<ContinueWatchingItem[]>([]);

  const { data: allItems, isLoading, error, refetch } = useQuery<StoredCineItem[], Error>({
    queryKey: ['contentItemsHomeAni'],
    queryFn: getContentItems,
  });

  const activeItems = useMemo(() => allItems?.filter(item => item.status === 'ativo') || [], [allItems]);

  // Effect to load "Continue Watching" items from localStorage
  useEffect(() => {
    if (!activeItems || activeItems.length === 0) {
        setContinueWatchingItems([]); // Clear if no active items to match against
        return;
    }

    const loadedContinueWatching: ContinueWatchingItem[] = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('video-progress-')) {
          const progressString = localStorage.getItem(key);
          if (progressString) {
            const progressData: ProgressData = JSON.parse(progressString);
            // Consider an item for "Continue Watching" if progress is between 5s and 95% of duration
            // or if duration is unknown but progress > 5s.
            const isMeaningfulProgress = progressData.time > 5 && 
                                        (progressData.duration ? progressData.time < progressData.duration * 0.98 : true);

            if (isMeaningfulProgress) {
              const itemIdMatch = key.match(/^video-progress-([a-zA-Z0-9]+)(?:-s\d+-e\d+)?$/);
              const itemId = itemIdMatch ? itemIdMatch[1] : null;
              
              if (itemId) {
                const matchingItem = activeItems.find(item => item.id === itemId);
                if (matchingItem && !loadedContinueWatching.some(cw => cw.id === matchingItem.id)) { // Avoid duplicates if multiple episode progresses exist for one series
                  loadedContinueWatching.push({
                    ...matchingItem,
                    lastSaved: progressData.lastSaved,
                    progressTime: progressData.time,
                    progressDuration: progressData.duration
                  });
                }
              }
            }
          }
        }
      }
    } catch (e) {
      console.error("Error accessing localStorage for continue watching:", e);
    }
    
    // Sort by most recently saved progress
    loadedContinueWatching.sort((a, b) => b.lastSaved - a.lastSaved);
    setContinueWatchingItems(loadedContinueWatching.slice(0, 10)); // Limit to e.g. 10 items
  }, [activeItems]); // Re-run when activeItems are loaded/changed


  const heroItem = useMemo(() => {
    const featured = activeItems.find(item => item.destaqueHome === true);
    if (featured) return featured;
    
    // Fallback: most recent non-continue-watching item
    const nonContinueWatchingIds = new Set(continueWatchingItems.map(cw => cw.id));
    const sortedActiveItems = [...activeItems]
        .filter(item => !nonContinueWatchingIds.has(item.id)) // Exclude items already in continue watching
        .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
    
    return sortedActiveItems.length > 0 ? sortedActiveItems[0] : (activeItems.length > 0 ? activeItems[0] : null);
  }, [activeItems, continueWatchingItems]);

  const itemsForGenreRows = useMemo(() => {
    const excludeIds = new Set(continueWatchingItems.map(cw => cw.id));
    if (heroItem) {
      excludeIds.add(heroItem.id);
    }
    return activeItems.filter(item => !excludeIds.has(item.id));
  }, [activeItems, heroItem, continueWatchingItems]);

  const genreRows = useMemo(() => {
    if (!itemsForGenreRows) return [];

    const genresMap: Map<string, StoredCineItem[]> = new Map();

    itemsForGenreRows.forEach(item => {
      const itemGenres = (item.generos || '')
        .split(',')
        .map(g => g.trim())
        .filter(Boolean)
        .map(g => g.charAt(0).toUpperCase() + g.slice(1).toLowerCase()); 

      itemGenres.forEach(genre => {
        if (!genresMap.has(genre)) {
          genresMap.set(genre, []);
        }
        // Add item if not already in the genre's list for this pass (though not strictly needed with current logic)
        if (!genresMap.get(genre)!.find(i => i.id === item.id)) {
            genresMap.get(genre)!.push(item);
        }
      });
    });
    
    return Array.from(genresMap.entries())
      .map(([genre, items]) => ({ title: genre, items }))
      .sort((a, b) => a.title.localeCompare(b.title));

  }, [itemsForGenreRows]);


  const handleCardClick = (item: StoredCineItem) => {
    setSelectedItem(item);
  };

  const handleCloseModal = () => {
    setSelectedItem(null);
  };

  if (isLoading) {
    return (
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center text-center h-[80vh]">
          <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
          <p className="text-lg text-muted-foreground">Carregando sua experiência cinéfila...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center text-center py-10 bg-destructive/10 p-6 rounded-lg">
          <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
          <p className="text-lg text-destructive font-semibold mb-2">Oops! Algo deu errado.</p>
          <p className="text-muted-foreground mb-4">{error.message}</p>
          <Button onClick={() => refetch()} variant="destructive">Tentar Novamente</Button>
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="flex-grow bg-background text-foreground">
        {heroItem && (
          <HomeAniHeroCard item={heroItem} onViewDetailsClick={() => handleCardClick(heroItem)} />
        )}

        <div className="container mx-auto px-2 sm:px-4 lg:px-6 space-y-10 pb-12">
          {continueWatchingItems.length > 0 && (
            <ContentRow
              key="continue-watching"
              title="Continue Assistindo"
              items={continueWatchingItems}
              onCardClick={handleCardClick}
              icon={<PlaySquare className="mr-2 h-6 w-6" />}
            />
          )}

          {genreRows.map(genreRow => (
            <ContentRow 
              key={genreRow.title}
              title={genreRow.title}
              items={genreRow.items}
              onCardClick={handleCardClick}
              icon={<Tag className="mr-2 h-6 w-6" />}
            />
          ))}
          
          {!heroItem && genreRows.length === 0 && continueWatchingItems.length === 0 && (
            <div className="text-center py-20">
              <Flame className="h-24 w-24 text-primary mx-auto mb-6 opacity-50" />
              <h2 className="text-2xl font-semibold text-foreground mb-2">Sua Cineteca Está Vazia!</h2>
              <p className="text-lg text-muted-foreground">Adicione filmes e séries na área de gerenciamento para começar.</p>
            </div>
          )}
        </div>
      </main>
      
      <HomeAniDetailModal 
        item={selectedItem}
        isOpen={!!selectedItem}
        onClose={handleCloseModal}
      />
    </>
  );
}

// Helper component for content rows
interface ContentRowProps {
  title: string;
  items: StoredCineItem[]; // Accepts StoredCineItem or ContinueWatchingItem
  onCardClick: (item: StoredCineItem) => void;
  icon?: React.ReactNode;
}

function ContentRow({ title, items, onCardClick, icon }: ContentRowProps) {
  if (!items || items.length === 0) return null;

  return (
    <section>
      <div className="flex items-center mb-4 px-2 sm:px-0">
        {icon && <span className="text-primary">{icon}</span>}
        <h2 className="text-xl sm:text-2xl font-semibold text-foreground">{title}</h2>
      </div>
      <div className="relative">
        <div className="flex space-x-3 sm:space-x-4 pb-4 overflow-x-auto scrollbar-thin scrollbar-thumb-muted-foreground/50 scrollbar-track-transparent pl-2 sm:pl-0">
          {items.map((item) => (
            <HomeAniContentCard 
              key={item.id + (item as ContinueWatchingItem).lastSaved || ''} // Ensure unique key for continue watching
              item={item} 
              onClick={() => onCardClick(item)}
            />
          ))}
           {/* Sentinel for scroll padding */}
          <div className="flex-shrink-0 w-px h-px" />
        </div>
      </div>
      <Separator className="my-8 bg-border/50" />
    </section>
  );
}

