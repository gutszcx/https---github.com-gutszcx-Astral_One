
// src/components/homeani/HomeAniHeroCarouselItem.tsx
'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import type { StoredCineItem } from '@/types';
import { PlayCircle, Info } from 'lucide-react';

interface HomeAniHeroCarouselItemProps {
  item: StoredCineItem;
  onViewDetailsClick: (item: StoredCineItem) => void;
  isPriority?: boolean;
}

export function HomeAniHeroCarouselItem({ item, onViewDetailsClick, isPriority = false }: HomeAniHeroCarouselItemProps) {
  const backgroundImage = item.bannerFundo || item.capaPoster || `https://placehold.co/1280x720.png?text=${encodeURIComponent(item.tituloOriginal)}`;
  const dataAiHint = item.bannerFundo ? "movie scene tv series background" : (item.capaPoster ? (item.contentType === 'movie' ? "movie poster" : "tv show poster") : "placeholder image");

  return (
    <div 
      className="relative w-full h-full text-white shadow-2xl cursor-pointer group"
      onClick={() => onViewDetailsClick(item)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onViewDetailsClick(item); }}
      aria-label={`Ver detalhes de ${item.tituloOriginal}`}
    >
      <Image
        src={backgroundImage}
        alt={`Destaque: ${item.tituloOriginal}`}
        layout="fill"
        objectFit="cover"
        className="z-0 group-hover:scale-105 transition-transform duration-300"
        priority={isPriority}
        data-ai-hint={dataAiHint}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent z-10"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-transparent to-transparent z-10 md:w-3/4 lg:w-2/3"></div>
      
      <div className="relative z-20 p-4 md:p-8 lg:p-10 h-full flex flex-col justify-end">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-1 md:mb-2 drop-shadow-lg">
          {item.tituloOriginal}
        </h1>
        {item.tituloLocalizado && item.tituloLocalizado !== item.tituloOriginal && (
            <h2 className="text-base md:text-lg text-slate-200 mb-2 md:mb-3 drop-shadow-md">
                {item.tituloLocalizado}
            </h2>
        )}
        {item.sinopse && (
          <p className="text-xs md:text-sm text-slate-300 mb-2 md:mb-4 line-clamp-2 max-w-sm lg:max-w-md drop-shadow-md">
            {item.sinopse}
          </p>
        )}
        <div className="flex space-x-2">
          <Button 
            size="default" 
            onClick={(e) => { e.stopPropagation(); onViewDetailsClick(item); }} 
            className="bg-white text-black hover:bg-neutral-200 font-semibold shadow-lg"
            aria-label={`Ver detalhes e assistir ${item.tituloOriginal}`}
          >
            <PlayCircle className="mr-1.5 h-4 w-4" /> Assistir
          </Button>
          <Button 
            variant="default" 
            size="default" 
            onClick={(e) => { e.stopPropagation(); onViewDetailsClick(item); }}
            className="bg-neutral-700/70 text-white hover:bg-neutral-600/70 font-semibold border-transparent shadow-lg"
            aria-label={`Mais informações sobre ${item.tituloOriginal}`}
          >
            <Info className="mr-1.5 h-4 w-4" /> Info
          </Button>
        </div>
      </div>
    </div>
  );
}

