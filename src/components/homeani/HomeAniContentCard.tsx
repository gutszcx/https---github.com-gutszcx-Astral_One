// src/components/homeani/HomeAniContentCard.tsx
'use client';

import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Film, Tv } from 'lucide-react';
import type { StoredCineItem } from '@/types';

interface HomeAniContentCardProps {
  item: StoredCineItem;
  onClick: () => void; // Added onClick prop
}

export function HomeAniContentCard({ item, onClick }: HomeAniContentCardProps) {
  const mediaTypeIcon = item.contentType === 'movie' 
    ? <Film className="h-4 w-4 text-muted-foreground" /> 
    : <Tv className="h-4 w-4 text-muted-foreground" />;
  
  const mediaTypeLabel = item.contentType === 'movie' ? 'Filme' : 'Série';

  return (
    <Card 
      className="overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out flex flex-col h-full bg-card cursor-pointer group hover:scale-105 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2"
      onClick={onClick} // Added onClick handler to the Card
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); }} // Accessibility for keyboard
      tabIndex={0} // Make it focusable
      role="button" // ARIA role
      aria-label={`Ver detalhes de ${item.tituloOriginal}`}
    >
      <CardHeader className="p-0 relative aspect-[2/3] w-full bg-muted/50">
        <Image
          src={item.capaPoster || `https://placehold.co/300x450.png?text=${encodeURIComponent(item.tituloOriginal)}`}
          alt={`Poster de ${item.tituloOriginal}`}
          layout="fill"
          objectFit="cover"
          className="rounded-t-md transition-transform duration-300 group-hover:brightness-110"
          data-ai-hint={item.contentType === 'movie' ? "movie poster" : "tv show poster"}
        />
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle className="text-lg font-semibold leading-tight truncate mb-1 group-hover:text-primary transition-colors" title={item.tituloOriginal}>
          {item.tituloOriginal}
        </CardTitle>
        <div className="flex items-center text-sm text-muted-foreground">
          {mediaTypeIcon}
          <span className="ml-1.5">{mediaTypeLabel} {item.anoLancamento && `(${item.anoLancamento})`}</span>
        </div>
      </CardContent>
    </Card>
  );
}
