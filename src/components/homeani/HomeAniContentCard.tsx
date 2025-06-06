
// src/components/homeani/HomeAniContentCard.tsx
'use client';

import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Film, Tv, Star } from 'lucide-react';
import type { StoredCineItem } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress'; // Added import

interface HomeAniContentCardProps {
  item: StoredCineItem & { progressTime?: number; progressDuration?: number }; // Updated to include optional progress props
  onClick: () => void;
}

export function HomeAniContentCard({ item, onClick }: HomeAniContentCardProps) {
  const mediaTypeIcon = item.contentType === 'movie' 
    ? <Film className="h-3 w-3 text-muted-foreground group-hover:text-[hsl(var(--neon-green-accent))] transition-colors" /> 
    : <Tv className="h-3 w-3 text-muted-foreground group-hover:text-[hsl(var(--neon-green-accent))] transition-colors" />;
  
  const mediaTypeLabel = item.contentType === 'movie' ? 'Filme' : 'Série';

  const hasProgress = typeof item.progressTime === 'number' && typeof item.progressDuration === 'number' && item.progressDuration > 0;
  const progressPercentage = hasProgress ? (item.progressTime! / item.progressDuration!) * 100 : 0;

  return (
    <Card 
      className="overflow-hidden shadow-md hover:shadow-xl focus-within:ring-2 focus-within:ring-[hsl(var(--neon-green-accent))] focus-within:ring-offset-2 bg-card cursor-pointer group w-40 sm:w-48 md:w-56 lg:w-60 xl:w-64 flex-shrink-0 rounded-lg transition-all duration-300 ease-in-out hover:scale-105 group-hover:shadow-[0_0_15px_1px_hsl(var(--neon-green-glow)/0.7)]"
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}
      tabIndex={0}
      role="button"
      aria-label={`Ver detalhes de ${item.tituloOriginal}`}
    >
      <div className="relative aspect-video w-full bg-muted/50">
        <Image
          src={item.capaPoster || `https://placehold.co/320x180.png?text=${encodeURIComponent(item.tituloOriginal)}`}
          alt={`Poster de ${item.tituloOriginal}`}
          layout="fill"
          objectFit="cover"
          className="rounded-t-lg transition-transform duration-300 group-hover:brightness-110" // Ensure top corners are rounded if global is not enough
          data-ai-hint={item.contentType === 'movie' ? "movie thumbnail" : "tv show thumbnail"}
        />
        {item.destaqueHome && (
           <Badge variant="destructive" className="absolute top-2 right-2 text-xs px-1.5 py-0.5 shadow-md rounded-full">
            <Star className="h-3 w-3 mr-1" /> Destaque
           </Badge>
        )}
         {hasProgress && (
          <div className="absolute bottom-0 left-0 right-0 px-1.5 pb-1.5 pt-4 bg-gradient-to-t from-black/70 to-transparent">
            <Progress value={progressPercentage} className="h-1.5 w-full bg-white/30 [&>div]:bg-[hsl(var(--neon-green-accent))] rounded-full" />
          </div>
        )}
      </div>
      <CardContent className="p-3">
        <h3 className="text-sm font-semibold leading-tight truncate mb-0.5 group-hover:text-[hsl(var(--neon-green-accent))] transition-colors" title={item.tituloOriginal}>
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
