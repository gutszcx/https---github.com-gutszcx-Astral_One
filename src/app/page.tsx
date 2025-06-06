
// src/app/page.tsx (HomeAni Homepage - Netflix Style Genre Rows)
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getContentItems } from '@/lib/firebaseService';
import type { StoredCineItem } from '@/types';
import { HomeAniContentCard } from '@/components/homeani/HomeAniContentCard';
// HomeAniDetailModal is now in RootLayout
import { HomeAniHeroCard } from '@/components/homeani/HomeAniHeroCard';
import { Loader2, AlertTriangle, Flame, Tag, PlaySquare, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useModal } from '@/contexts/ModalContext'; // Import useModal

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
  const { openModal } = useModal(); // Use the modal context
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
                // Avoid duplicates if multiple episodes of same series are in progress but we only show the series once
                if (matchingItem && !loadedContinueWatching.some(cw => cw.id === matchingItem.id)) { 
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
    
    // Prioritize items marked for homepage destaque
    const featured = activeItems
        .filter(item => item.destaqueHome === true)
        .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime());

    if (featured.length > 0) {
        return featured[0]; // Show the newest featured item
    }
    
    // Fallback: If no featured items, pick the most recent active item not in "Continue Watching"
    const continueWatchingIds = new Set(continueWatchingItems.map(cw => cw.id));
    const mostRecentActive = activeItems
      .filter(item => !continueWatchingIds.has(item.id))
      .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime());
    
    if (mostRecentActive.length > 0) {
      return mostRecentActive[0];
    }

    // Further Fallback: if all active items are in continue watching, pick the newest overall active item for hero
     if (activeItems.length > 0) {
        return activeItems.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime())[0];
    }

    return null; // No suitable item found
  }, [activeItems, continueWatchingItems]);


  const itemsForGenreRows = useMemo(() => {
    // Now, all active items are considered for genre rows.
    // Duplication with Hero/Continue Watching is possible but ensures all items with genres are listed.
    return activeItems;
  }, [activeItems]);

  const genreRows = useMemo(() => {
    if (!itemsForGenreRows) return [];

    const genresMap: Map<string, StoredCineItem[]> = new Map();
    const miscellaneousItems: StoredCineItem[] = [];
    const processedForGenreMap = new Set<string>(); // Keep track of items added to specific genres

    itemsForGenreRows.forEach(item => {
      let itemGenres = (item.generos || '')
        .split(',')
        .map(g => g.trim())
        .filter(Boolean)
        .map(g => g.charAt(0).toUpperCase() + g.slice(1).toLowerCase());

      if (itemGenres.length === 0) {
        // Add to miscellaneous only if not already processed for a specific genre (though this condition is moot here)
        // and not already in miscellaneous.
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
        processedForGenreMap.add(item.id); // Mark item as processed for specific genres
      }
    });
    
    // Ensure items only in "Continue Watching" or "Hero" (if they have no genres) also go to "Diversos"
    // if they weren't caught by the specific genre logic and are not the hero or in continue watching.
    // This part might be redundant if itemsForGenreRows now includes everything.
    // The original logic for miscellaneousItems handles items with no genres correctly.

    const sortedGenreRows = Array.from(genresMap.entries())
      .map(([genre, items]) => ({ title: genre, items, icon: <Tag className="mr-2 h-6 w-6" /> }))
      .sort((a, b) => a.title.localeCompare(b.title));

    // Add miscellaneous items, ensuring they weren't already part of a specific genre row
    // if `itemsForGenreRows` logic was more exclusive before.
    // With `itemsForGenreRows = activeItems`, an item with no genre will go to miscellaneous.
    // An item with genres will go to specific genre rows.
    const finalMiscellaneousItems = miscellaneousItems.filter(item => !processedForGenreMap.has(item.id));


    if (finalMiscellaneousItems.length > 0) {
      sortedGenreRows.push({ title: "Diversos", items: finalMiscellaneousItems, icon: <Layers className="mr-2 h-6 w-6" /> });
    }
    
    return sortedGenreRows;

  }, [itemsForGenreRows]);


  const handleCardClick = (item: StoredCineItem & { _playActionData?: { seasonNumber: number; episodeIndex: number } }, playDirectly: boolean = false) => {
    openModal(item, playDirectly ? 'play' : null);
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

  // Filter heroItem and continueWatchingItems from main genre display if they are already shown in their dedicated rows
  const genreRowItemsToDisplay = genreRows.map(genreRow => {
    const filteredItems = genreRow.items.filter(item => {
        const isHero = heroItem?.id === item.id;
        const isContinueWatching = continueWatchingItems.some(cw => cw.id === item.id);
        
        // If the row is "Continue Assistindo", all its items are fine.
        if (genreRow.title === "Continue Assistindo") return true;

        // For other genre rows, only include if NOT the hero and NOT in continue watching list.
        // This is to prevent triple display if an item is hero, continue, AND in a genre.
        // However, the main `itemsForGenreRows` now includes everything, so this filtering
        // is done at the display stage of the rows themselves, except for the dedicated Continue Watching row.
        // The Continue Watching row below explicitly uses `continueWatchingItems`.
        // Other genre rows use `genreRows` which are derived from all `activeItems`.
        // So, we need to filter hero and continue items from *those specific genre rows* if they'd duplicate.

        // Let's refine the logic for genreRows source itself.
        // itemsForGenreRows = activeItems.
        // The genreRows calculation populates genresMap.
        // The ContentRow component is responsible for rendering.
        // It's simpler to let genreRows contain all items and then decide duplication at render,
        // OR filter itemsForGenreRows initially.
        // The change made was to itemsForGenreRows, so items are now included.
        // Duplication is now accepted to ensure visibility.

        return true; // With the change to itemsForGenreRows, we accept potential duplication.
    });
    return { ...genreRow, items: filteredItems };
  }).filter(genreRow => genreRow.items.length > 0);


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

          {genreRowItemsToDisplay.map(genreRow => {
            // Ensure we don't re-render "Continue Assistindo" if it was part of genreRows
            if (genreRow.title === "Continue Assistindo" && continueWatchingItems.length > 0) return null;
            
            // Filter out items that are ALREADY in the continueWatchingItems list from other genre rows
            // to prevent them from appearing in, for example, "Action" AND "Continue Watching".
            // Hero item can still be duplicated.
            const itemsForThisRow = genreRow.items.filter(item => 
                !continueWatchingItems.some(cw => cw.id === item.id && genreRow.title !== "Continue Assistindo")
            );

            if (itemsForThisRow.length === 0) return null;

            return (
                <ContentRow 
                key={genreRow.title}
                title={genreRow.title}
                items={itemsForThisRow}
                onCardClick={(item) => handleCardClick(item)}
                icon={genreRow.icon}
                />
            );
           })}
          
          {heroItem === null && genreRows.length === 0 && continueWatchingItems.length === 0 && (
            <div className="text-center py-20">
              <Flame className="h-24 w-24 text-primary mx-auto mb-6 opacity-50" />
              <h2 className="text-2xl font-semibold text-foreground mb-2">Sua Cineteca Está Vazia!</h2>
              <p className="text-lg text-muted-foreground">Adicione filmes e séries na área de gerenciamento para começar.</p>
            </div>
          )}
        </div>
      </main>
      
      {/* HomeAniDetailModal is now rendered in RootLayout */}
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
              key={item.id + ((item as ContinueWatchingItem).lastSaved || '')} // Ensure key is unique if item appears in multiple rows with different contexts
              item={item as StoredCineItem & { progressTime?: number; progressDuration?: number }}
              onClick={() => onCardClick(item as ContinueWatchingItem)}
            />
          ))}
          <div className="flex-shrink-0 w-px h-px" /> {/* Spacer for scroll */}
        </div>
      </div>
      <Separator className="my-8 bg-border/50" />
    </section>
  );
}

