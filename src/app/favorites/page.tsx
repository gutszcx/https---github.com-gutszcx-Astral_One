
// src/app/favorites/page.tsx
'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getContentItems } from '@/lib/firebaseService';
import type { StoredCineItem } from '@/types';
import { HomeAniContentCard } from '@/components/homeani/HomeAniContentCard';
import { Loader2, AlertTriangle, HeartCrack, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useModal } from '@/contexts/ModalContext';
import Link from 'next/link';

export default function FavoritesPage() {
  const { favoriteIds } = useFavorites();
  const { openModal } = useModal();

  const { data: allItems, isLoading, error, refetch } = useQuery<StoredCineItem[], Error>({
    queryKey: ['contentItemsFavoritesPage'], // Unique query key for this page
    queryFn: getContentItems,
  });

  const favoriteItems = useMemo(() => {
    if (!allItems || favoriteIds.length === 0) return [];
    const favoriteSet = new Set(favoriteIds);
    return allItems.filter(item => favoriteSet.has(item.id) && item.status === 'ativo');
  }, [allItems, favoriteIds]);

  const handleCardClick = (item: StoredCineItem) => {
    openModal(item);
  };

  if (isLoading) {
    return (
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center text-center h-[70vh]">
          <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
          <p className="text-lg text-muted-foreground">Carregando seus favoritos...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center text-center py-10 bg-destructive/10 p-6 rounded-lg">
          <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
          <p className="text-lg text-destructive font-semibold mb-2">Erro ao Carregar Favoritos</p>
          <p className="text-muted-foreground mb-4">{error.message}</p>
          <Button onClick={() => refetch()} variant="destructive">Tentar Novamente</Button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-grow container mx-auto px-4 py-8">
      <div className="flex items-center mb-6 md:mb-8">
        <Star className="h-8 w-8 text-primary mr-3" />
        <h1 className="text-3xl md:text-4xl font-bold text-primary">Meus Favoritos</h1>
      </div>

      {favoriteItems.length === 0 ? (
        <div className="text-center py-20">
          <HeartCrack className="h-24 w-24 text-primary mx-auto mb-6 opacity-50" />
          <h2 className="text-2xl font-semibold text-foreground mb-2">Sua Lista de Favoritos Está Vazia!</h2>
          <p className="text-lg text-muted-foreground mb-6">Explore o catálogo e adicione os conteúdos que mais gostar.</p>
          <Button asChild size="lg" className="cyberpunk-button-primary">
            <Link href="/">Explorar Catálogo</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
          {favoriteItems.map((item) => (
            <HomeAniContentCard
              key={item.id}
              item={item}
              onClick={() => handleCardClick(item)}
            />
          ))}
        </div>
      )}
    </main>
  );
}
