
// src/components/cine-form/TmdbSearchResultCard.tsx
'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { TmdbSearchResultItem } from '@/ai/flows/tmdb-auto-fill';
import { Film, Tv, CheckCircle } from 'lucide-react';

interface TmdbSearchResultCardProps {
  item: TmdbSearchResultItem;
  onSelect: () => void;
  isSelecting: boolean;
}

export function TmdbSearchResultCard({ item, onSelect, isSelecting }: TmdbSearchResultCardProps) {
  const mediaTypeIcon = item.mediaType === 'movie' 
    ? <Film className="h-4 w-4 text-muted-foreground" /> 
    : <Tv className="h-4 w-4 text-muted-foreground" />;
  
  const mediaTypeLabel = item.mediaType === 'movie' ? 'Filme' : 'Série';

  return (
    <Card className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200 flex flex-col h-full">
      <CardHeader className="p-0 relative aspect-[2/3] w-full">
        <Image
          src={item.posterUrl}
          alt={`Poster de ${item.title}`}
          layout="fill"
          objectFit="cover"
          className="rounded-t-md"
          data-ai-hint={item.mediaType === 'movie' ? "movie poster" : "tv poster"}
        />
      </CardHeader>
      <CardContent className="p-3 flex-grow">
        <CardTitle className="text-base font-semibold leading-tight truncate mb-1" title={item.title}>
          {item.title}
        </CardTitle>
        <div className="flex items-center text-xs text-muted-foreground mb-1">
          {mediaTypeIcon}
          <span className="ml-1">{mediaTypeLabel} {item.releaseYear && `(${item.releaseYear})`}</span>
        </div>
        {item.overview && (
          <CardDescription className="text-xs line-clamp-3">
            {item.overview}
          </CardDescription>
        )}
      </CardContent>
      <CardFooter className="p-3 border-t">
        <Button 
          onClick={onSelect} 
          disabled={isSelecting}
          className="w-full"
          size="sm"
          variant="outline"
        >
          <CheckCircle className="mr-2 h-4 w-4" />
          Selecionar
        </Button>
      </CardFooter>
    </Card>
  );
}
