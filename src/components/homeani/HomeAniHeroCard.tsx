
// src/components/homeani/HomeAniHeroCard.tsx
'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import type { StoredCineItem } from '@/types';
import { PlayCircle, Info } from 'lucide-react';

interface HomeAniHeroCardProps {
  item: StoredCineItem;
  onViewDetailsClick: () => void;
}

export function HomeAniHeroCard({ item, onViewDetailsClick }: HomeAniHeroCardProps) {
  const backgroundImage = item.bannerFundo || item.capaPoster || `https://placehold.co/1280x720.png?text=${encodeURIComponent(item.tituloOriginal)}`;
  const dataAiHint = item.bannerFundo ? "movie scene tv series background" : (item.capaPoster ? (item.contentType === 'movie' ? "movie poster" : "tv show poster") : "placeholder image");

  return (
    <div className="relative w-full h-[60vh] md:h-[75vh] text-white shadow-2xl rounded-lg overflow-hidden mb-12">
      <Image
        src={backgroundImage}
        alt={`Destaque: ${item.tituloOriginal}`}
        layout="fill"
        objectFit="cover"
        className="z-0 rounded-lg"
        priority
        data-ai-hint={dataAiHint}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent z-10 rounded-lg"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-transparent to-transparent z-10 md:w-3/4 lg:w-2/3 rounded-lg"></div>
      
      <div className="relative z-20 p-6 md:p-12 lg:p-16 h-full flex flex-col justify-end">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-3 md:mb-4 drop-shadow-[0_2px_3px_rgba(0,0,0,0.7)]">
          {item.tituloOriginal}
        </h1>
        {item.tituloLocalizado && item.tituloLocalizado !== item.tituloOriginal && (
            <h2 className="text-xl md:text-2xl text-slate-200 mb-4 drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]">
                {item.tituloLocalizado}
            </h2>
        )}
        {item.sinopse && (
          <p className="text-sm md:text-base lg:text-lg text-slate-300 mb-6 md:mb-8 line-clamp-2 md:line-clamp-3 max-w-xl lg:max-w-2xl drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
            {item.sinopse}
          </p>
        )}
        <div className="flex space-x-3 md:space-x-4">
          <Button 
            size="lg" 
            onClick={onViewDetailsClick} 
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 rounded-md"
            aria-label={`Ver detalhes e assistir ${item.tituloOriginal}`}
          >
            <PlayCircle className="mr-2 h-5 w-5 md:h-6 md:w-6" /> Assistir Agora
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            onClick={onViewDetailsClick}
            className="bg-white/10 border-2 border-white/20 text-white hover:bg-white/20 font-semibold shadow-md hover:shadow-lg transition-all duration-300 rounded-md backdrop-blur-sm"
            aria-label={`Mais informações sobre ${item.tituloOriginal}`}
          >
            <Info className="mr-2 h-5 w-5 md:h-6 md:w-6" /> Mais Informações
          </Button>
        </div>
      </div>
    </div>
  );
}
