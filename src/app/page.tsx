
// src/app/page.tsx (New HomeAni Homepage)
'use client';

import { useQuery } from '@tanstack/react-query';
import { getContentItems } from '@/lib/firebaseService';
import type { StoredCineItem } from '@/types';
import { HomeAniContentCard } from '@/components/homeani/HomeAniContentCard';
import { Loader2, AlertTriangle, Film } from 'lucide-react';
import { Button } from '@/components/ui/button'; // For potential refresh button

export default function HomeAniPage() {
  const { data: items, isLoading, error, refetch } = useQuery<StoredCineItem[], Error>({
    queryKey: ['contentItemsHomeAni'], // Use a distinct queryKey
    queryFn: getContentItems,
  });

  return (
    <main className="flex-grow container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-primary mb-3 flex items-center justify-center">
          <Film className="mr-4 h-12 w-12" />
          Bem-vindo ao HomeAni!
        </h1>
        <p className="text-xl text-muted-foreground">Explore nossa coleção de filmes e séries.</p>
      </div>

      {isLoading && (
        <div className="flex flex-col items-center justify-center text-center py-10">
          <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
          <p className="text-lg text-muted-foreground">Carregando conteúdo...</p>
        </div>
      )}

      {error && (
        <div className="flex flex-col items-center justify-center text-center py-10 bg-destructive/10 p-6 rounded-lg">
          <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
          <p className="text-lg text-destructive font-semibold mb-2">Erro ao carregar conteúdo</p>
          <p className="text-muted-foreground mb-4">{error.message}</p>
          <Button onClick={() => refetch()} variant="destructive">Tentar Novamente</Button>
        </div>
      )}

      {!isLoading && !error && items && items.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 md:gap-8">
          {items.filter(item => item.status === 'ativo').map((item) => ( // Only show 'active' items
            <HomeAniContentCard key={item.id} item={item} />
          ))}
        </div>
      )}

      {!isLoading && !error && (!items || items.filter(item => item.status === 'ativo').length === 0) && (
        <div className="text-center py-10">
          <p className="text-lg text-muted-foreground">Nenhum conteúdo disponível no momento. Volte em breve!</p>
        </div>
      )}
    </main>
  );
}
