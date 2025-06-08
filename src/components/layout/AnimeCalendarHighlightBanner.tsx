// src/components/layout/AnimeCalendarHighlightBanner.tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { fetchUpcomingAnimeEpisodes } from '@/ai/flows/fetch-upcoming-anime-episodes-flow';
import type { UpcomingTmdbEpisodeInfo } from '@/types';
import { Button } from '@/components/ui/button';
import { CalendarDays, ExternalLink } from 'lucide-react';
import { format, isToday, isTomorrow, differenceInCalendarDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export function AnimeCalendarHighlightBanner() {
  const { data: upcomingEpisodes, isLoading, error } = useQuery<UpcomingTmdbEpisodeInfo[], Error>({
    queryKey: ['upcomingAnimeEpisodesForBanner'],
    queryFn: fetchUpcomingAnimeEpisodes,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  if (isLoading || error || !upcomingEpisodes || upcomingEpisodes.length === 0) {
    return null; 
  }

  const today = new Date();
  const relevantEpisodes = upcomingEpisodes.filter(ep => {
    try {
      const airDate = parseISO(ep.airDate);
      // Ensure airDate is valid before comparison
      if (isNaN(airDate.getTime())) return false;
      return differenceInCalendarDays(airDate, today) >= 0 && differenceInCalendarDays(airDate, today) <= 2; // Today, tomorrow, day after tomorrow
    } catch (e) {
      return false; // Invalid date format
    }
  }).slice(0, 3); // Max 3 episodes in banner

  if (relevantEpisodes.length === 0) {
    return null;
  }

  const getRelativeDateText = (airDateStr: string) => {
    try {
      const airDate = parseISO(airDateStr);
      if (isNaN(airDate.getTime())) return '';
      if (isToday(airDate)) return 'Hoje';
      if (isTomorrow(airDate)) return 'Amanhã';
      return `em ${format(airDate, 'dd/MM', { locale: ptBR })}`;
    } catch (e) {
      return '';
    }
  };

  const bannerTitle = relevantEpisodes.some(ep => isToday(parseISO(ep.airDate)))
    ? "Lançamentos de Anime Hoje e Em Breve"
    : "Próximos Lançamentos de Anime";

  return (
    <div className="bg-card/90 backdrop-blur-md border-b border-border shadow-sm py-2.5 px-4 w-full sticky top-[47px] z-40">
      {/* Header height assumed to be 47px. This is based on p-1 (8px) + logo height (39px) = 47px. */}
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between text-sm">
        <div className="flex items-center mb-2 sm:mb-0 text-left">
          <CalendarDays className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3 text-primary flex-shrink-0" />
          <div className="flex-grow">
            <h3 className="font-semibold text-primary">
              {bannerTitle}
            </h3>
            <p className="text-xs text-muted-foreground line-clamp-1">
              {relevantEpisodes.map(ep => 
                `${ep.seriesTitle.substring(0,20)}${ep.seriesTitle.length > 20 ? '...' : ''} (S${ep.seasonNumber}E${ep.episodeNumber}) ${getRelativeDateText(ep.airDate)}`
              ).join(' • ')}
            </p>
          </div>
        </div>
        <Button asChild variant="ghost" size="sm" className="text-primary hover:bg-primary/10 px-2 sm:px-3">
          <Link href="/anime-calendar">
            Calendário Completo <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
