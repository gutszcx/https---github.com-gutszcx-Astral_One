
// src/components/homeani/HomeAniContentCard.tsx
'use client';

import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Film, Tv } from 'lucide-react';
import type { StoredCineItem } from '@/types';

interface HomeAniContentCardProps {
  item: StoredCineItem;
}

export function HomeAniContentCard({ item }: HomeAniContentCardProps) {
  const mediaTypeIcon = item.contentType === 'movie' 
    ? <Film className="h-4 w-4 text-muted-foreground" /> 
    : <Tv className="h-4 w-4 text-muted-foreground" />;
  
  const mediaTypeLabel = item.contentType === 'movie' ? 'Filme' : 'Série';

  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col h-full bg-card">
      <CardHeader className="p-0 relative aspect-[2/3] w-full bg-muted/50">
        <Image
          src={item.capaPoster || `https://placehold.co/300x450.png?text=${encodeURIComponent(item.tituloOriginal)}`}
          alt={`Poster de ${item.tituloOriginal}`}
          layout="fill"
          objectFit="cover"
          className="rounded-t-md"
          data-ai-hint={item.contentType === 'movie' ? "movie poster" : "tv show poster"}
        />
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle className="text-lg font-semibold leading-tight truncate mb-1" title={item.tituloOriginal}>
          {item.tituloOriginal}
        </CardTitle>
        <div className="flex items-center text-sm text-muted-foreground">
          {mediaTypeIcon}
          <span className="ml-1.5">{mediaTypeLabel} {item.anoLancamento && `(${item.anoLancamento})`}</span>
        </div>
        {/* You could add more details here, like genres, if desired */}
      </CardContent>
      {/* No footer with actions for the public-facing card */}
    </Card>
  );
}
