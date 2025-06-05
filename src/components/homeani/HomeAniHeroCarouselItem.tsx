
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
      
      <div className="relative z-20 p-8 md:p-14 lg:p-20 h-full flex flex-col justify-end">
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-4 md:mb-5 drop-shadow-lg">
          {item.tituloOriginal}
        </h1>
        {item.tituloLocalizado && item.tituloLocalizado !== item.tituloOriginal && (
            <h2 className="text-2xl md:text-3xl text-slate-200 mb-5 drop-shadow-md">
                {item.tituloLocalizado}
            </h2>
        )}
        {item.sinopse && (
          <p className="text-base md:text-lg lg:text-xl text-slate-300 mb-8 md:mb-10 line-clamp-2 md:line-clamp-3 max-w-2xl lg:max-w-3xl drop-shadow-md">
            {item.sinopse}
          </p>
        )}
        <div className="flex space-x-4 md:space-x-5">
          <Button 
            size="lg" 
            onClick={(e) => { e.stopPropagation(); onViewDetailsClick(item); }} 
            className="bg-white text-black hover:bg-neutral-200 font-semibold shadow-lg text-base"
            aria-label={`Ver detalhes e assistir ${item.tituloOriginal}`}
          >
            <PlayCircle className="mr-2.5 h-6 w-6 md:h-7 md:w-7" /> Assistir
          </Button>
          <Button 
            variant="default" 
            size="lg" 
            onClick={(e) => { e.stopPropagation(); onViewDetailsClick(item); }}
            className="bg-neutral-700/70 text-white hover:bg-neutral-600/70 font-semibold border-transparent shadow-lg text-base"
            aria-label={`Mais informações sobre ${item.tituloOriginal}`}
          >
            <Info className="mr-2.5 h-6 w-6 md:h-7 md:w-7" /> Info
          </Button>
        </div>
      </div>
    </div>
  );
}

