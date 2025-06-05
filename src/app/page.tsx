
// src/app/page.tsx (HomeAni Homepage - Netflix Style Genre Rows)
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getContentItems } from '@/lib/firebaseService';
import type { StoredCineItem } from '@/types';
import { HomeAniContentCard } from '@/components/homeani/HomeAniContentCard';
import { HomeAniDetailModal } from '@/components/homeani/HomeAniDetailModal';
import { HomeAniHeroCard } from '@/components/homeani/HomeAniHeroCard';
import { Loader2, AlertTriangle, Flame, Tag, PlaySquare, Layers } from 'lucide-react';
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
  _playActionData?: { seasonNumber: number; episodeIndex: number };
}

export default function HomeAniPage() {
  const [selectedItem, setSelectedItem] = useState<(StoredCineItem & { _playActionData?: { seasonNumber: number; episodeIndex: number } }) | null>(null);
  const [initialModalAction, setInitialModalAction] = useState<'play' | null>(null);
  const [continueWatchingItems, setContinueWatchingItems] = useState<ContinueWatchingItem[]>([]);

  const { data: allItems, isLoading, error, refetch } = useQuery<StoredCineItem[], Error>({
    queryKey: ['contentItemsHomeAni'],
    queryFn: getContentItems,
  });

  const activeItems = useMemo(() => allItems?.filter(item => item.status === 'ativo') || [], [allItems]);

  // Effect to load "Continue Watching" items from localStorage
  useEffect(() => {
    if (!activeItems || activeItems.length === 0) {
        setContinueWatchingItems([]);
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
            const isMeaningfulProgress = progressData.time > 5 &&
                                        (progressData.duration ? progressData.time < progressData.duration * 0.98 : true);

            if (isMeaningfulProgress) {
              const itemIdMatch = key.match(/^video-progress-([a-zA-Z0-9]+)(?:-s(\d+)-e(\d+))?$/);
              const itemId = itemIdMatch ? itemIdMatch[1] : null;
              const seasonNumber = itemIdMatch && itemIdMatch[2] ? parseInt(itemIdMatch[2], 10) : undefined;
              const episodeIndex = itemIdMatch && itemIdMatch[3] ? parseInt(itemIdMatch[3], 10) : undefined;

              if (itemId) {
                const matchingItem = activeItems.find(item => item.id === itemId);
                if (matchingItem && !loadedContinueWatching.some(cw => cw.id === matchingItem.id)) { // Avoid duplicates if multiple episodes of same series
                  const continueItem: ContinueWatchingItem = {
                    ...matchingItem,
                    lastSaved: progressData.lastSaved,
                    progressTime: progressData.time,
                    progressDuration: progressData.duration,
                  };
                  if (typeof seasonNumber === 'number' && typeof episodeIndex === 'number' && matchingItem.contentType === 'series') {
                    continueItem._playActionData = { seasonNumber, episodeIndex };
                  }
                  loadedContinueWatching.push(continueItem);
                }
              }
            }
          }
        }
      }
    } catch (e) {
      console.error("Error accessing localStorage for continue watching:", e);
    }

    loadedContinueWatching.sort((a, b) => b.lastSaved - a.lastSaved);
    setContinueWatchingItems(loadedContinueWatching.slice(0, 10));
  }, [activeItems]);


  const heroItem = useMemo(() => {
    if (!activeItems || activeItems.length === 0) return null;

    const featured = activeItems
      .filter(item => item.destaqueHome === true)
      .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime());

    if (featured.length > 0) {
      return featured[0];
    }

    const continueWatchingIds = new Set(continueWatchingItems.map(cw => cw.id));
    const mostRecentActive = activeItems
      .filter(item => !continueWatchingIds.has(item.id))
      .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime());

    if (mostRecentActive.length > 0) {
      return mostRecentActive[0];
    }
    
    // Fallback: if all active items are in continue watching, pick the newest overall active item for hero
    if (activeItems.length > 0) {
        return activeItems.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime())[0];
    }

    return null;
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
    const miscellaneousItems: StoredCineItem[] = [];

    itemsForGenreRows.forEach(item => {
      let itemGenres = (item.generos || '')
        .split(',')
        .map(g => g.trim())
        .filter(Boolean)
        .map(g => g.charAt(0).toUpperCase() + g.slice(1).toLowerCase());

      if (itemGenres.length === 0) {
        if (!miscellaneousItems.find(i => i.id === item.id)) {
            miscellaneousItems.push(item);
        }
      } else {
        itemGenres.forEach(genre => {
          if (!genresMap.has(genre)) {
            genresMap.set(genre, []);
          }
          if (!genresMap.get(genre)!.find(i => i.id === item.id)) {
              genresMap.get(genre)!.push(item);
          }
        });
      }
    });

    const sortedGenreRows = Array.from(genresMap.entries())
      .map(([genre, items]) => ({ title: genre, items, icon: <Tag className="mr-2 h-6 w-6" /> }))
      .sort((a, b) => a.title.localeCompare(b.title));

    if (miscellaneousItems.length > 0) {
      sortedGenreRows.push({ title: "Diversos", items: miscellaneousItems, icon: <Layers className="mr-2 h-6 w-6" /> });
    }
    
    return sortedGenreRows;

  }, [itemsForGenreRows]);


  const handleCardClick = (item: StoredCineItem & { _playActionData?: { seasonNumber: number; episodeIndex: number } }, playDirectly: boolean = false) => {
    setSelectedItem(item);
    if (playDirectly) {
        setInitialModalAction('play');
    } else {
        setInitialModalAction(null); // Ensure normal modal opening
    }
  };
  
  const handleCloseModal = () => {
    setSelectedItem(null);
    setInitialModalAction(null); // Reset action on close
  };

  const handleInitialActionConsumed = () => {
    setInitialModalAction(null);
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
              onCardClick={(item) => handleCardClick(item, true)} // Pass true to play directly
              icon={<PlaySquare className="mr-2 h-6 w-6" />}
            />
          )}

          {genreRows.map(genreRow => (
            <ContentRow 
              key={genreRow.title}
              title={genreRow.title}
              items={genreRow.items}
              onCardClick={(item) => handleCardClick(item)}
              icon={genreRow.icon}
            />
          ))}
          
          {heroItem === null && genreRows.length === 0 && continueWatchingItems.length === 0 && (
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
        initialAction={initialModalAction}
        onInitialActionConsumed={handleInitialActionConsumed}
      />
    </>
  );
}

// Helper component for content rows
interface ContentRowProps {
  title: string;
  items: StoredCineItem[];
  onCardClick: (item: StoredCineItem & { _playActionData?: { seasonNumber: number; episodeIndex: number } }) => void;
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
              key={item.id + ((item as ContinueWatchingItem).lastSaved || '')}
              item={item as StoredCineItem & { progressTime?: number; progressDuration?: number }}
              onClick={() => onCardClick(item as ContinueWatchingItem)}
            />
          ))}
          <div className="flex-shrink-0 w-px h-px" />
        </div>
      </div>
      <Separator className="my-8 bg-border/50" />
    </section>
  );
}
