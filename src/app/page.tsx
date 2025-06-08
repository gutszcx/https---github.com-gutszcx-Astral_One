
// src/app/page.tsx (HomeAni Homepage - Netflix Style Genre Rows)
'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getContentItems } from '@/lib/firebaseService';
import type { StoredCineItem, ContinueWatchingItem, StoredSeriesItem, Episode, Season } from '@/types'; // Import ContinueWatchingItem
import { HomeAniContentCard } from '@/components/homeani/HomeAniContentCard';
import { HomeAniHeroCard } from '@/components/homeani/HomeAniHeroCard';
import { Loader2, AlertTriangle, Flame, Tag, PlaySquare, Layers, Sparkles } from 'lucide-react'; // Added Sparkles
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useModal } from '@/contexts/ModalContext';
import { useRecentActivity } from '@/contexts/RecentActivityContext'; // Import useRecentActivity
import { cn } from '@/lib/utils';
import { AnimeLoadingScreen } from '@/components/layout/AnimeLoadingScreen'; // Import the themed loading screen

interface ProgressData {
  time: number;
  duration: number;
  lastSaved: number;
}

interface LastPlayedData {
  lastPlayed: number;
}

// ContinueWatchingItem is now imported from @/types

export default function HomeAniPage() {
  const { openModal, isModalOpen } = useModal(); // Destructure isModalOpen
  const { updateMostRecentItem } = useRecentActivity(); // Get updater from context
  const [continueWatchingItems, setContinueWatchingItems] = useState<ContinueWatchingItem[]>([]);

  const refetchIntervalTime = 300000; // 5 minutos (300000 ms)

  const { data: allItems, isLoading, error, refetch } = useQuery<StoredCineItem[], Error>({
    queryKey: ['contentItemsHomeAni'],
    queryFn: getContentItems,
    refetchInterval: isModalOpen ? false : refetchIntervalTime, // Atualiza apenas se o modal não estiver aberto
    refetchIntervalInBackground: false, // Não busca se a aba estiver em segundo plano
    refetchOnWindowFocus: true, // Busca ao focar na janela
  });

  const activeItems = useMemo(() => allItems?.filter(item => item.status === 'ativo') || [], [allItems]);

  useEffect(() => {
    if (!activeItems || activeItems.length === 0) {
        setContinueWatchingItems([]);
        updateMostRecentItem(null); // Update context if no items
        return;
    }

    const loadedContinueWatching: ContinueWatchingItem[] = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;

        let itemId: string | null = null;
        let seasonNumber: number | undefined = undefined;
        let episodeIndex: number | undefined = undefined;
        let interactionData: any = null;
        let interactionType: 'direct' | 'embed' | undefined = undefined;
        let lastSavedTimestamp: number = 0;

        if (key.startsWith('video-progress-')) {
          const progressString = localStorage.getItem(key);
          if (progressString) {
            interactionData = JSON.parse(progressString) as ProgressData;
            const isMeaningfulProgress = interactionData.time > 5 &&
                                        (interactionData.duration ? interactionData.time < interactionData.duration * 0.98 : true);
            if (!isMeaningfulProgress) continue;

            interactionType = 'direct';
            lastSavedTimestamp = interactionData.lastSaved;
            const match = key.match(/^video-progress-([a-zA-Z0-9]+)(?:-s(\d+)-e(\d+))?$/);
            itemId = match ? match[1] : null;
            seasonNumber = match && match[2] ? parseInt(match[2], 10) : undefined;
            episodeIndex = match && match[3] ? parseInt(match[3], 10) : undefined;
          }
        } else if (key.startsWith('video-last-played-')) {
          const lastPlayedString = localStorage.getItem(key);
          if (lastPlayedString) {
            interactionData = JSON.parse(lastPlayedString) as LastPlayedData;
            interactionType = 'embed';
            lastSavedTimestamp = interactionData.lastPlayed;
            const match = key.match(/^video-last-played-([a-zA-Z0-9]+)(?:-s(\d+)-e(\d+))?$/);
            itemId = match ? match[1] : null;
            seasonNumber = match && match[2] ? parseInt(match[2], 10) : undefined;
            episodeIndex = match && match[3] ? parseInt(match[3], 10) : undefined;
          }
        }

        if (itemId && interactionType) {
          const matchingItem = activeItems.find(item => item.id === itemId);
          if (matchingItem && !loadedContinueWatching.some(cw => cw.id === matchingItem.id)) {
            const continueItem: ContinueWatchingItem = {
              ...matchingItem,
              lastSaved: lastSavedTimestamp,
              interactionType: interactionType,
            };
            if (interactionType === 'direct' && interactionData) {
              continueItem.progressTime = (interactionData as ProgressData).time;
              continueItem.progressDuration = (interactionData as ProgressData).duration;
            }
            if (typeof seasonNumber === 'number' && typeof episodeIndex === 'number' && matchingItem.contentType === 'series') {
              continueItem._playActionData = { seasonNumber, episodeIndex };
            }
            loadedContinueWatching.push(continueItem);
          }
        }
      }
    } catch (e) {
      console.error("Error accessing localStorage for continue watching:", e);
    }

    loadedContinueWatching.sort((a, b) => b.lastSaved - a.lastSaved);
    setContinueWatchingItems(loadedContinueWatching.slice(0, 10));
    updateMostRecentItem(loadedContinueWatching.length > 0 ? loadedContinueWatching[0] : null); // Update context

  }, [activeItems, updateMostRecentItem]); // Added updateMostRecentItem to dependency array

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

     if (activeItems.length > 0) {
        return activeItems.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime())[0];
    }

    return null;
  }, [activeItems, continueWatchingItems]);


  const itemsForGenreRows = useMemo(() => {
    return activeItems;
  }, [activeItems]);

  const genreRows = useMemo(() => {
    if (!itemsForGenreRows) return [];

    const genresMap: Map<string, StoredCineItem[]> = new Map();
    const miscellaneousItems: StoredCineItem[] = [];
    const processedForGenreMap = new Set<string>();

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
        processedForGenreMap.add(item.id);
      }
    });


    const sortedGenreRows = Array.from(genresMap.entries())
      .map(([genre, items]) => ({ title: genre, items, icon: <Tag className="mr-2 h-6 w-6" /> }))
      .sort((a, b) => a.title.localeCompare(b.title));

    const finalMiscellaneousItems = miscellaneousItems.filter(item => !processedForGenreMap.has(item.id));


    if (finalMiscellaneousItems.length > 0) {
      sortedGenreRows.push({ title: "Diversos", items: finalMiscellaneousItems, icon: <Layers className="mr-2 h-6 w-6" /> });
    }

    return sortedGenreRows;

  }, [itemsForGenreRows]);

  const newEpisodeSeries = useMemo(() => {
    if (!activeItems) return [];
    const seriesItems = activeItems.filter(item => item.contentType === 'series') as StoredSeriesItem[];
    
    return seriesItems.map(series => {
        let latestSeason: Season | undefined;
        if (series.temporadas && series.temporadas.length > 0) {
            latestSeason = series.temporadas.reduce((latest, current) => 
                current.numeroTemporada > latest.numeroTemporada ? current : latest
            );
        }

        let firstEpisodeOfLatestSeason: Episode | undefined;
        if (latestSeason && latestSeason.episodios && latestSeason.episodios.length > 0) {
            firstEpisodeOfLatestSeason = latestSeason.episodios[0]; // Assuming episodes are ordered
        }
        
        return {
            ...series,
            _displayNewEpisodeInfo: firstEpisodeOfLatestSeason && latestSeason ? {
                season: latestSeason.numeroTemporada,
                episode: 1, // We're displaying "E1" as the representative new episode
                episodeTitle: firstEpisodeOfLatestSeason.titulo,
            } : undefined,
        };
    })
    .filter(item => item._displayNewEpisodeInfo !== undefined) // Only include series where we found new episode info
    .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime()) // Sort by most recently updated overall
    .slice(0, 12);
}, [activeItems]);


  const handleCardClick = (item: StoredCineItem & { _playActionData?: { seasonNumber: number; episodeIndex: number } }, playDirectly: boolean = false) => {
    openModal(item, playDirectly ? 'play' : null);
  };

  // Show themed loading screen if data is loading and no active items are available yet
  if (isLoading && !activeItems.length) {
    return <AnimeLoadingScreen message="Carregando Astral One..." />;
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

  const genreRowItemsToDisplay = genreRows.map(genreRow => {
    const filteredItems = genreRow.items.filter(item => {
        // Exclude items that might be shown in "Continue Watching" or "Em Alta" if those rows are present
        // This helps avoid too much repetition if those special rows also pick items from these genres.
        // const isContinueWatching = continueWatchingItems.some(cw => cw.id === item.id);
        // return !isContinueWatching; 
        // Decided to allow items to appear in multiple rows if they fit criteria.
        return true;
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
              onCardClick={(item) => handleCardClick(item, true)}
              icon={<PlaySquare className="mr-2 h-6 w-6" />}
            />
          )}

          {/* "Em Alta" row. Could use a different data source or logic if "trending" means something other than "recently watched by user" */}
          {continueWatchingItems.length > 0 && ( // Using continueWatchingItems for now as a proxy for "trending for user"
            <ContentRow
              key="trending-now"
              title="Em Alta"
              items={continueWatchingItems} // You might want to sort or filter this differently for true trending
              onCardClick={(item) => handleCardClick(item)}
              icon={<Flame className="mr-2 h-6 w-6" />}
            />
          )}

          {newEpisodeSeries.length > 0 && (
             <ContentRow
              key="new-episodes"
              title="Novos Episódios"
              items={newEpisodeSeries}
              onCardClick={(item) => handleCardClick(item, true)}
              icon={<Sparkles className="mr-2 h-6 w-6" />}
            />
          )}

          {genreRowItemsToDisplay.map(genreRow => {
            // If the genre title is one of the special rows handled above, skip it here.
            // This check might be too simplistic if genreRows could naturally be named "Continue Assistindo"
            if ((genreRow.title === "Continue Assistindo" || genreRow.title === "Em Alta" || genreRow.title === "Novos Episódios") && (continueWatchingItems.length > 0 || newEpisodeSeries.length > 0)) return null;
            
            if (genreRow.items.length === 0) return null; // Also skip if, after filtering, the genre row is empty

            return (
                <ContentRow
                key={genreRow.title}
                title={genreRow.title}
                items={genreRow.items}
                onCardClick={(item) => handleCardClick(item)}
                icon={genreRow.icon}
                />
            );
           })}

          {/* Message for when there is absolutely no content */}
          {heroItem === null && genreRows.length === 0 && continueWatchingItems.length === 0 && newEpisodeSeries.length === 0 && !isLoading && (
            <div className="text-center py-20">
              <Flame className="h-24 w-24 text-primary mx-auto mb-6 opacity-50" />
              <h2 className="text-2xl font-semibold text-foreground mb-2">Sua Cineteca Está Vazia!</h2>
              <p className="text-lg text-muted-foreground">Adicione filmes e séries na área de gerenciamento para começar.</p>
            </div>
          )}
        </div>
      </main>

    </>
  );
}

interface ContentRowProps {
  title: string;
  items: (StoredCineItem & { progressTime?: number; progressDuration?: number; _playActionData?: { seasonNumber: number; episodeIndex: number }, _displayNewEpisodeInfo?: { season: number; episode: number; episodeTitle?: string } })[];
  onCardClick: (item: StoredCineItem & { _playActionData?: { seasonNumber: number; episodeIndex: number } }) => void;
  icon?: React.ReactNode;
}


function ContentRow({ title, items, onCardClick, icon }: ContentRowProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftStart, setScrollLeftStart] = useState(0);

  if (!items || items.length === 0) return null;

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeftStart(scrollContainerRef.current.scrollLeft);
    scrollContainerRef.current.style.cursor = 'grabbing';
    scrollContainerRef.current.style.userSelect = 'none';
  };

  const handleMouseLeave = () => {
    if (!scrollContainerRef.current) return;
    setIsDragging(false);
    scrollContainerRef.current.style.cursor = 'grab';
    scrollContainerRef.current.style.removeProperty('user-select');
  };

  const handleMouseUp = () => {
    if (!scrollContainerRef.current) return;
    setIsDragging(false);
    scrollContainerRef.current.style.cursor = 'grab';
    scrollContainerRef.current.style.removeProperty('user-select');
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Adjust scroll speed if needed
    scrollContainerRef.current.scrollLeft = scrollLeftStart - walk;
  };


  return (
    <section>
      <div className="flex items-center mb-4 px-2 sm:px-0">
        {icon && <span className="text-primary">{icon}</span>}
        <h2 className="text-xl sm:text-2xl font-semibold text-foreground">{title}</h2>
      </div>
      <div className="relative">
        <div
          ref={scrollContainerRef}
          className="flex space-x-3 sm:space-x-4 pb-4 overflow-x-auto scrollbar-hide pl-2 sm:pl-0 cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
        >
          {items.map((item) => (
            <HomeAniContentCard
              key={item.id + ((item as ContinueWatchingItem).lastSaved || '') + (item._displayNewEpisodeInfo ? `_s${item._displayNewEpisodeInfo.season}e${item._displayNewEpisodeInfo.episode}` : '')}
              item={item}
              onClick={() => {
                // Prevent click if it was a drag
                if (startX !== 0 && scrollContainerRef.current && Math.abs(scrollContainerRef.current.scrollLeft - scrollLeftStart) > 5) {
                    // Reset startX to allow click on next attempt if it's not a drag
                    setStartX(0); 
                    return;
                }
                setStartX(0); // Reset for next click
                onCardClick(item as ContinueWatchingItem)
              }}
            />
          ))}
          <div className="flex-shrink-0 w-px h-px" /> {/* Helper for consistent spacing at the end */}
        </div>
      </div>
      <Separator className="my-8 bg-border/50" />
    </section>
  );
}

