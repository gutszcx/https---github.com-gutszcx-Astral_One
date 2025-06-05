
// src/components/homeani/HomeAniHeroCarousel.tsx
'use client';

import * as React from 'react';
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselDots,
  type CarouselApi,
} from "@/components/ui/carousel";
import type { StoredCineItem } from '@/types';
import { HomeAniHeroCarouselItem } from './HomeAniHeroCarouselItem';

interface HomeAniHeroCarouselProps {
  items: StoredCineItem[];
  onViewDetailsClick: (item: StoredCineItem) => void;
}

export function HomeAniHeroCarousel({ items, onViewDetailsClick }: HomeAniHeroCarouselProps) {
  const [api, setApi] = React.useState<CarouselApi>()
 
  const plugin = React.useRef(
    Autoplay({ delay: 5000, stopOnInteraction: true, stopOnMouseEnter: true })
  )

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <Carousel
      setApi={setApi}
      opts={{
        loop: true,
        align: "start",
        direction: 'ltr', // Explicitly set direction
      }}
      plugins={[plugin.current]}
      className="w-full h-[110vh] mb-8 rounded-lg overflow-hidden"
      onMouseEnter={plugin.current.stop}
      onMouseLeave={plugin.current.reset}
    >
      <CarouselContent>
        {items.map((item, index) => (
          <CarouselItem key={item.id} className="h-full">
            <HomeAniHeroCarouselItem
              item={item}
              onViewDetailsClick={onViewDetailsClick}
              isPriority={index === 0} // Give priority to the first image for LCP
            />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselDots />
    </Carousel>
  );
}

