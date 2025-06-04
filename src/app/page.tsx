
// src/app/page.tsx (New HomeAni Homepage - Prime Video Style)
'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getContentItems } from '@/lib/firebaseService';
import type { StoredCineItem } from '@/types';
import { HomeAniContentCard } from '@/components/homeani/HomeAniContentCard';
import { HomeAniDetailModal } from '@/components/homeani/HomeAniDetailModal';
import { HomeAniHeroCard } from '@/components/homeani/HomeAniHeroCard'; // New Hero Card
import { Loader2, AlertTriangle, Film, Tv, History, Flame } from 'lucide-react'; // Added icons
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export default function HomeAniPage() {
  const [selectedItem, setSelectedItem] = useState<StoredCineItem | null>(null);

  const { data: allItems, isLoading, error, refetch } = useQuery<StoredCineItem[], Error>({
    queryKey: ['contentItemsHomeAni'],
    queryFn: getContentItems,
  });

  const activeItems = useMemo(() => allItems?.filter(item => item.status === 'ativo') || [], [allItems]);

  const heroItem = useMemo(() => {
    const featured = activeItems.find(item => item.destaqueHome === true);
    if (featured) return featured;
    // Fallback: pick the most recently updated item if no featured item is found
    return activeItems.length > 0 
      ? [...activeItems].sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())[0] 
      : null;
  }, [activeItems]);

  const movies = useMemo(() => activeItems.filter(item => item.contentType === 'movie' && item.id !== heroItem?.id), [activeItems, heroItem]);
  const series = useMemo(() => activeItems.filter(item => item.contentType === 'series' && item.id !== heroItem?.id), [activeItems, heroItem]);


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

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-10 pb-12">
          {/* Placeholder for "Continue Watching" - Requires user session & tracking */}
          {/* <ContentRow title="Continuar Assistindo" items={[]} onCardClick={handleCardClick} icon={<History className="mr-2 h-6 w-6" />} /> */}

          {movies.length > 0 && (
            <ContentRow title="Filmes Populares" items={movies} onCardClick={handleCardClick} icon={<Film className="mr-2 h-6 w-6" />} />
          )}

          {series.length > 0 && (
            <ContentRow title="Séries em Destaque" items={series} onCardClick={handleCardClick} icon={<Tv className="mr-2 h-6 w-6" />} />
          )}
          
          {!heroItem && movies.length === 0 && series.length === 0 && (
            <div className="text-center py-20">
              <Flame className="h-24 w-24 text-primary mx-auto mb-6 opacity-50" />
              <h2 className="text-2xl font-semibold text-foreground mb-2">Sua Cineteca Está Vazia!</h2>
              <p className="text-lg text-muted-foreground">Adicione filmes e séries na área de gerenciamento para começar.</p>
              {/* Optional: Add a button to navigate to /manage */}
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
  items: StoredCineItem[];
  onCardClick: (item: StoredCineItem) => void;
  icon?: React.ReactNode;
}

function ContentRow({ title, items, onCardClick, icon }: ContentRowProps) {
  if (!items || items.length === 0) return null;

  return (
    <section>
      <div className="flex items-center mb-4">
        {icon && <span className="text-primary">{icon}</span>}
        <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
      </div>
      <div className="relative">
        <div className="flex space-x-4 pb-4 overflow-x-auto scrollbar-thin scrollbar-thumb-muted-foreground/50 scrollbar-track-transparent">
          {items.map((item) => (
            <HomeAniContentCard 
              key={item.id} 
              item={item} 
              onClick={() => onCardClick(item)}
            />
          ))}
        </div>
        {/* Optional: Add custom scroll buttons if needed later */}
      </div>
      <Separator className="my-8 bg-border/50" />
    </section>
  );
}
