
// src/components/homeani/HomeAniContentCard.tsx
'use client';

import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card'; // Removed CardHeader, CardTitle
import { Film, Tv, Star } from 'lucide-react';
import type { StoredCineItem } from '@/types';
import { Badge } from '@/components/ui/badge';

interface HomeAniContentCardProps {
  item: StoredCineItem;
  onClick: () => void;
}

export function HomeAniContentCard({ item, onClick }: HomeAniContentCardProps) {
  const mediaTypeIcon = item.contentType === 'movie' 
    ? <Film className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" /> 
    : <Tv className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />;
  
  const mediaTypeLabel = item.contentType === 'movie' ? 'Filme' : 'Série';

  return (
    <Card 
      className="overflow-hidden shadow-md hover:shadow-xl focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 bg-card cursor-pointer group w-64 md:w-72 flex-shrink-0 rounded-lg transition-all duration-300 ease-in-out hover:scale-105"
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}
      tabIndex={0}
      role="button"
      aria-label={`Ver detalhes de ${item.tituloOriginal}`}
    >
      <div className="relative aspect-video w-full bg-muted/50"> {/* Changed to aspect-video */}
        <Image
          src={item.capaPoster || `https://placehold.co/320x180.png?text=${encodeURIComponent(item.tituloOriginal)}`}
          alt={`Poster de ${item.tituloOriginal}`}
          layout="fill"
          objectFit="cover"
          className="rounded-t-md transition-transform duration-300 group-hover:brightness-110"
          data-ai-hint={item.contentType === 'movie' ? "movie thumbnail" : "tv show thumbnail"}
        />
        {item.destaqueHome && (
           <Badge variant="destructive" className="absolute top-2 right-2 text-xs px-1.5 py-0.5 shadow-md">
            <Star className="h-3 w-3 mr-1" /> Destaque
           </Badge>
        )}
      </div>
      <CardContent className="p-3">
        <h3 className="text-sm font-semibold leading-tight truncate mb-0.5 group-hover:text-primary transition-colors" title={item.tituloOriginal}>
          {item.tituloOriginal}
        </h3>
        <div className="flex items-center text-xs text-muted-foreground">
          {mediaTypeIcon}
          <span className="ml-1">{mediaTypeLabel}</span>
          {item.anoLancamento && <span className="ml-1.5">&bull; {item.anoLancamento}</span>}
        </div>
      </CardContent>
    </Card>
  );
}
