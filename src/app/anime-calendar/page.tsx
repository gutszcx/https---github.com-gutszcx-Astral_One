
// src/app/anime-calendar/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import { format, parseISO, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, Loader2, AlertTriangle, Tv, Clapperboard, Info } from 'lucide-react';

import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

import { fetchUpcomingAnimeEpisodes } from '@/ai/flows/fetch-upcoming-anime-episodes-flow';
import type { UpcomingTmdbEpisodeInfo, StoredCineItem } from '@/types';
import { useModal } from '@/contexts/ModalContext';
import { getContentItems } from '@/lib/firebaseService'; // To find item in our DB

export default function AnimeCalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const { openModal } = useModal();

  const { data: upcomingEpisodes, isLoading, error, refetch } = useQuery<UpcomingTmdbEpisodeInfo[], Error>({
    queryKey: ['upcomingAnimeEpisodes'],
    queryFn: fetchUpcomingAnimeEpisodes,
  });

  const { data: allContentItems } = useQuery<StoredCineItem[], Error>({
    queryKey: ['contentItemsForCalendarLink'],
    queryFn: getContentItems,
  });

  const releaseDates = useMemo(() => {
    if (!upcomingEpisodes) return [];
    return upcomingEpisodes.map(ep => parseISO(ep.airDate));
  }, [upcomingEpisodes]);

  const episodesForSelectedDate = useMemo(() => {
    if (!upcomingEpisodes || !selectedDate) return [];
    return upcomingEpisodes.filter(ep => isSameDay(parseISO(ep.airDate), selectedDate));
  }, [upcomingEpisodes, selectedDate]);

  const handleEpisodeClick = (episode: UpcomingTmdbEpisodeInfo) => {
    if (!allContentItems) {
      alert("Dados de conteúdo ainda não carregados. Tente novamente em breve.");
      return;
    }
    const matchingStoredItem = allContentItems.find(item => item.tmdbId === episode.seriesTmdbId && item.contentType === 'series');
    
    if (matchingStoredItem) {
      // Prepare playActionData to hint the modal which episode to focus on/play
      const playActionData = {
        seasonNumber: episode.seasonNumber,
        // Episode numbers from TMDB are 1-based, indices are 0-based
        episodeIndex: episode.episodeNumber - 1 
      };
      openModal({ ...matchingStoredItem, _playActionData: playActionData }, 'play');
    } else {
      // Fallback: open modal with basic info if not in our DB, or just show an alert
      // For simplicity, we'll show an alert or ideally fetch fresh details for the modal.
      // For now, we can construct a temporary item for the modal to display info
      const tempItemForModal: StoredCineItem = {
        id: `tmdb-${episode.seriesTmdbId}`, // Temporary ID
        tmdbId: episode.seriesTmdbId,
        contentType: 'series',
        tituloOriginal: episode.seriesTitle,
        sinopse: episode.seriesOverview,
        capaPoster: episode.posterUrl,
        bannerFundo: '', // Not available directly from this flow for series banner
        // Fill other required StoredCineItem fields with defaults or placeholders
        tmdbSearchQuery: '',
        tituloLocalizado: '',
        generos: 'Animação', // Assume
        idiomaOriginal: 'Japonês', // Assume
        dublagensDisponiveis: '',
        anoLancamento: episode.airDate ? parseInt(episode.airDate.substring(0,4)) : null,
        duracaoMedia: null,
        classificacaoIndicativa: 'Livre',
        qualidade: 'HD',
        tags: 'Anime',
        destaqueHome: false,
        status: 'ativo',
        totalTemporadas: episode.seasonNumber, // We know at least this many
        temporadas: [{
          numeroTemporada: episode.seasonNumber,
          episodios: [{
            titulo: episode.episodeName,
            descricao: episode.episodeOverview,
            duracao: null,
            videoSources: [], // No video sources from this flow directly
            linkLegenda: '',
            id: `s${episode.seasonNumber}e${episode.episodeNumber}`
          }]
        }]
      };
      openModal(tempItemForModal);
    }
  };

  if (isLoading) {
    return (
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center text-center h-[70vh]">
          <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
          <p className="text-lg text-muted-foreground">Carregando calendário de lançamentos...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center text-center py-10 bg-destructive/10 p-6 rounded-lg">
          <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
          <p className="text-lg text-destructive font-semibold mb-2">Erro ao Carregar Calendário</p>
          <p className="text-muted-foreground mb-4">{error.message}</p>
          <Button onClick={() => refetch()} variant="destructive">Tentar Novamente</Button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-grow container mx-auto px-2 sm:px-4 py-8">
      <div className="flex items-center mb-6 md:mb-8">
        <CalendarIcon className="h-8 w-8 text-primary mr-3" />
        <h1 className="text-3xl md:text-4xl font-bold text-primary">Calendário de Lançamentos Anime</h1>
      </div>
      <p className="text-muted-foreground mb-6">
        Episódios de animes populares com lançamento previsto para os próximos 30 dias. Selecione uma data para ver os lançamentos.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        <Card className="md:col-span-1 shadow-lg">
          <CardContent className="p-3 sm:p-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
              locale={ptBR}
              modifiers={{ highlighted: releaseDates }}
              modifiersClassNames={{ highlighted: 'bg-primary/20 text-primary rounded-full' }}
              disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() -1)) || date > new Date(new Date().setDate(new Date().getDate() + 30))}
              initialFocus
            />
          </CardContent>
        </Card>

        <div className="md:col-span-2">
          <Card className="shadow-lg min-h-[300px]">
            <CardHeader>
              <CardTitle className="text-xl text-primary">
                Lançamentos para {selectedDate ? format(selectedDate, 'PPP', { locale: ptBR }) : 'Nenhuma data selecionada'}
              </CardTitle>
              <CardDescription>
                {episodesForSelectedDate.length > 0 
                  ? `Encontrado(s) ${episodesForSelectedDate.length} episódio(s).`
                  : "Nenhum lançamento encontrado para esta data ou dados não disponíveis."}
              </CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="p-0">
              <ScrollArea className="h-[400px] md:h-[500px]">
                {episodesForSelectedDate.length > 0 ? (
                  <ul className="divide-y divide-border">
                    {episodesForSelectedDate.map(ep => (
                      <li key={`${ep.seriesTmdbId}-${ep.seasonNumber}-${ep.episodeNumber}`} className="p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-start space-x-4">
                          <div className="flex-shrink-0 w-20 h-28 relative">
                            <Image 
                              src={ep.posterUrl} 
                              alt={`Poster de ${ep.seriesTitle}`} 
                              layout="fill" 
                              objectFit="cover" 
                              className="rounded"
                              data-ai-hint="anime series poster" 
                            />
                          </div>
                          <div className="flex-grow">
                            <h3 className="font-semibold text-md text-foreground">{ep.seriesTitle}</h3>
                            <p className="text-sm text-primary">
                              T{ep.seasonNumber} E{ep.episodeNumber}: {ep.episodeName}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">Lançamento: {format(parseISO(ep.airDate), 'dd/MM/yyyy', { locale: ptBR })}</p>
                            {ep.episodeOverview && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{ep.episodeOverview}</p>}
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => handleEpisodeClick(ep)} className="ml-auto self-center">
                            <Info className="mr-1.5 h-4 w-4"/> Detalhes
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-6 text-center text-muted-foreground">
                    <Tv className="mx-auto h-12 w-12 mb-3 opacity-50" />
                    {selectedDate ? "Nenhum episódio programado para esta data." : "Selecione uma data no calendário para ver os lançamentos."}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
