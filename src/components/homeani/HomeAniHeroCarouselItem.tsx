
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
      
      <div className="relative z-20 p-6 md:p-12 lg:p-16 h-full flex flex-col justify-end">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-3 md:mb-4 drop-shadow-lg">
          {item.tituloOriginal}
        </h1>
        {item.tituloLocalizado && item.tituloLocalizado !== item.tituloOriginal && (
            <h2 className="text-xl md:text-2xl text-slate-200 mb-4 drop-shadow-md">
                {item.tituloLocalizado}
            </h2>
        )}
        {item.sinopse && (
          <p className="text-sm md:text-base lg:text-lg text-slate-300 mb-6 md:mb-8 line-clamp-2 md:line-clamp-3 max-w-xl lg:max-w-2xl drop-shadow-md">
            {item.sinopse}
          </p>
        )}
        <div className="flex space-x-3 md:space-x-4">
          <Button 
            size="lg" 
            onClick={(e) => { e.stopPropagation(); onViewDetailsClick(item); }} 
            className="bg-white text-black hover:bg-neutral-200 font-semibold shadow-lg"
            aria-label={`Ver detalhes e assistir ${item.tituloOriginal}`}
          >
            <PlayCircle className="mr-2 h-5 w-5 md:h-6 md:w-6" /> Assistir
          </Button>
          <Button 
            variant="default" 
            size="lg" 
            onClick={(e) => { e.stopPropagation(); onViewDetailsClick(item); }}
            className="bg-neutral-700/70 text-white hover:bg-neutral-600/70 font-semibold border-transparent shadow-lg"
            aria-label={`Mais informações sobre ${item.tituloOriginal}`}
          >
            <Info className="mr-2 h-5 w-5 md:h-6 md:w-6" /> Info
          </Button>
        </div>
      </div>
    </div>
  );
}

