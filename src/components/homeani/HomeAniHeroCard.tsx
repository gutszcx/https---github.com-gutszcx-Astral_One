
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
        className="z-0 rounded-lg" // Ensure image itself is rounded if container is
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
            className="bg-[hsl(var(--neon-green-accent))] text-[hsl(var(--neon-green-accent-foreground))] hover:bg-[hsl(var(--neon-green-accent)/0.9)] font-semibold shadow-[0_0_10px_hsl(var(--neon-green-glow)),_0_0_20px_hsl(var(--neon-green-glow)/0.7)] hover:shadow-[0_0_15px_hsl(var(--neon-green-glow)),_0_0_25px_hsl(var(--neon-green-glow)/0.8)] transition-all duration-300 rounded-lg"
            aria-label={`Ver detalhes e assistir ${item.tituloOriginal}`}
          >
            <PlayCircle className="mr-2 h-5 w-5 md:h-6 md:w-6" /> Assistir Agora
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            onClick={onViewDetailsClick}
            className="bg-transparent border-2 border-[hsl(var(--neon-green-accent))] text-[hsl(var(--neon-green-accent))] hover:bg-[hsl(var(--neon-green-accent)/0.15)] hover:text-[hsl(var(--neon-green-accent))] font-semibold shadow-[0_0_8px_hsl(var(--neon-green-glow)/0.5)] hover:shadow-[0_0_12px_hsl(var(--neon-green-glow)/0.7),_0_0_18px_hsl(var(--neon-green-glow)/0.5)] transition-all duration-300 rounded-lg"
            aria-label={`Mais informações sobre ${item.tituloOriginal}`}
          >
            <Info className="mr-2 h-5 w-5 md:h-6 md:w-6" /> Mais Informações
          </Button>
        </div>
      </div>
    </div>
  );
}
