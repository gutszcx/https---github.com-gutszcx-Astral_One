
// src/components/homeani/HomeAniDetailModal.tsx
'use client';

import Image from 'next/image';
import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import 'plyr-react/plyr.css';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle as AlertDialogTitleComponent,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { StoredCineItem, StoredMovieItem, StoredSeriesItem, VideoSource } from '@/types';
import { Film, Tv, Clapperboard, Clock, PlayCircle, X, ListVideo, Loader2, Heart, MessageCircleQuestion, ArrowDownCircle } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useToast } from '@/hooks/use-toast';
import { useFavorites } from '@/contexts/FavoritesContext';
import { cn } from '@/lib/utils';
import { FeedbackDialog } from '@/components/feedback/FeedbackDialog';
import type PlyrJS from 'plyr';

// Dynamically import Plyr to ensure it's only loaded on the client-side
const Plyr = dynamic(() => import('plyr-react').then(mod => mod.default), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-10">
      <Loader2 className="h-12 w-12 animate-spin text-white mb-4" />
      <p className="text-white text-lg">Carregando Player...</p>
    </div>
  ),
});


interface HomeAniDetailModalProps {
  item: (StoredCineItem & { _playActionData?: { seasonNumber: number; episodeIndex: number } }) | null;
  isOpen: boolean;
  onClose: () => void;
  initialAction?: 'play' | null;
  onInitialActionConsumed?: () => void;
}

interface PlayerInfo {
  plyrSource: PlyrJS.SourceInfo;
  title: string;
  storageKey: string;
}

interface ServerSelectionInfo {
  sources: VideoSource[];
  subtitleUrl?: string;
  title: string;
  baseId: string;
  seasonNumber?: number;
  episodeIndex?: number;
}

interface ProgressData {
  time: number;
  duration: number;
  lastSaved: number;
}

export function HomeAniDetailModal({ item, isOpen, onClose, initialAction, onInitialActionConsumed }: HomeAniDetailModalProps) {
  const [activePlayerInfo, setActivePlayerInfo] = useState<PlayerInfo | null>(null);
  const [serverSelectionInfo, setServerSelectionInfo] = useState<ServerSelectionInfo | null>(null);
  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);
  const plyrRef = useRef<({ plyr: PlyrJS }) | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const { isFavorite, toggleFavorite } = useFavorites();
  const hasTriggeredInitialPlay = useRef(false);
  const [processingInitialAction, setProcessingInitialAction] = useState(false);
  const [isPlayerLoading, setIsPlayerLoading] = useState(false);

  const saveVideoProgress = useCallback((player: PlyrJS, storageKey: string) => {
    if (!player || !storageKey || Number.isNaN(player.currentTime) || Number.isNaN(player.duration) || player.duration === 0) return;
    try {
      const progressData: ProgressData = {
        time: player.currentTime,
        duration: player.duration,
        lastSaved: Date.now(),
      };
      localStorage.setItem(storageKey, JSON.stringify(progressData));
    } catch (e) {
      console.error("Error saving video progress to localStorage:", e);
    }
  }, []);

  const handleModalClose = useCallback(() => {
    const playerInstance = plyrRef.current?.plyr;
    if (playerInstance && activePlayerInfo) {
      saveVideoProgress(playerInstance, activePlayerInfo.storageKey);
      if (typeof playerInstance.stop === 'function') {
        playerInstance.stop();
      }
    }
    setActivePlayerInfo(null);
    setServerSelectionInfo(null);
    setIsFeedbackDialogOpen(false);
    hasTriggeredInitialPlay.current = false;
    setProcessingInitialAction(false);
    setIsPlayerLoading(false);
    onClose();
  }, [activePlayerInfo, onClose, saveVideoProgress]);

  const handlePlayerClose = useCallback(() => {
    const playerInstance = plyrRef.current?.plyr;
    if (playerInstance && activePlayerInfo) {
      saveVideoProgress(playerInstance, activePlayerInfo.storageKey);
       if (typeof playerInstance.stop === 'function') {
        playerInstance.stop();
      }
    }
    setActivePlayerInfo(null);
    setIsPlayerLoading(false);
  }, [activePlayerInfo, saveVideoProgress]);
  
  const initiatePlayback = useCallback((
    videoUrl: string,
    title: string,
    subtitleUrl?: string,
    baseId?: string,
    seasonNumber?: number,
    episodeIndex?: number
  ) => {
    if (!baseId) {
        console.error("Cannot initiate playback without a baseId for storageKey.");
        toast({ title: "Erro Interno", description: "Não foi possível identificar o conteúdo para salvar progresso.", variant: "destructive"});
        return;
    }
    let storageKey = `video-progress-${baseId}`;
    if (typeof seasonNumber === 'number' && typeof episodeIndex === 'number') {
      storageKey += `-s${seasonNumber}-e${episodeIndex}`;
    }

    const plyrSourceConfig: PlyrJS.SourceInfo = {
      type: 'video',
      title: title,
      sources: [
        {
          src: videoUrl,
          type: videoUrl.includes('.m3u8') ? 'application/x-mpegURL' : 'video/mp4',
        },
      ],
      poster: item?.bannerFundo || item?.capaPoster,
      tracks: subtitleUrl
        ? [
            {
              kind: 'subtitles',
              label: 'Português',
              srcLang: 'pt',
              src: subtitleUrl,
              default: true,
            },
          ]
        : [],
    };

    setActivePlayerInfo({ plyrSource: plyrSourceConfig, title, storageKey });
    setIsPlayerLoading(true); 
    setServerSelectionInfo(null);
  }, [toast, item]);


  const promptOrPlay = useCallback((
    sources: VideoSource[] | undefined,
    title: string,
    subtitleUrl?: string,
    baseId?: string,
    seasonNumber?: number,
    episodeIndex?: number
  ) => {
    if (!baseId) {
      toast({ title: "Conteúdo Inválido", description: "ID do conteúdo não encontrado.", variant: "destructive" });
      return false;
    }
    if (!sources || sources.length === 0) {
      toast({ title: "Sem Fontes de Vídeo", description: "Nenhum link de vídeo disponível para este conteúdo.", variant: "default" });
      return false;
    }
    const validSources = sources.filter(s => s.url && s.url.trim() !== '');
    if (validSources.length === 0) {
        toast({ title: "Sem Fontes de Vídeo Válidas", description: "Nenhum link de vídeo válido encontrado.", variant: "default" });
        return false;
    }

    if (validSources.length === 1) {
      initiatePlayback(validSources[0].url, title, subtitleUrl, baseId, seasonNumber, episodeIndex);
    } else {
      setServerSelectionInfo({ sources: validSources, subtitleUrl, title, baseId, seasonNumber, episodeIndex });
    }
    return true;
  }, [initiatePlayback, toast]);


  useEffect(() => {
    if (isOpen && initialAction === 'play' && !hasTriggeredInitialPlay.current && item) {
      setProcessingInitialAction(true);
    } else if (!isOpen) {
      setProcessingInitialAction(false);
      hasTriggeredInitialPlay.current = false;
    }
  }, [isOpen, initialAction, item]);

  useEffect(() => {
    if (isOpen && item && !activePlayerInfo && !serverSelectionInfo) {
        // This toast appears when the modal is open with details, but player isn't active.
        toast({
            title: "Conteúdo Carregado!",
            description: "Role a página para cima para encontrar opções de reprodução, temporadas e episódios.",
            duration: 5000, // Show for 5 seconds
        });
    }
  }, [isOpen, item, activePlayerInfo, serverSelectionInfo, toast]);


  useEffect(() => {
    if (isOpen && initialAction === 'play' && item && !activePlayerInfo && !serverSelectionInfo && !hasTriggeredInitialPlay.current && processingInitialAction) {
      hasTriggeredInitialPlay.current = true;
  
      const playData = item._playActionData;
  
      if (item.contentType === 'movie') {
        const movieItem = item as StoredMovieItem;
        if (movieItem.videoSources && movieItem.videoSources.filter(vs => vs.url && vs.url.trim() !== '').length > 0) {
          promptOrPlay(movieItem.videoSources, movieItem.tituloOriginal, movieItem.linkLegendas, movieItem.id);
        } else {
          toast({ title: "Sem Fontes de Vídeo", description: "Nenhum link de vídeo disponível para este filme.", variant: "default" });
        }
      } else if (item.contentType === 'series' && playData) {
        const seriesItem = item as StoredSeriesItem;
        const season = seriesItem.temporadas?.find(s => s.numeroTemporada === playData.seasonNumber);
        const episode = season?.episodios?.[playData.episodeIndex];
        if (episode && episode.videoSources && episode.videoSources.filter(vs => vs.url && vs.url.trim() !== '').length > 0) {
          promptOrPlay(episode.videoSources, `${seriesItem.tituloOriginal} - T${season!.numeroTemporada}E${playData.episodeIndex + 1}: ${episode.titulo}`, episode.linkLegenda, seriesItem.id, season!.numeroTemporada, playData.episodeIndex);
        } else {
          toast({ title: "Sem Fontes de Vídeo", description: "Nenhum link de vídeo disponível para este episódio.", variant: "default" });
        }
      } else if (item.contentType === 'series') {
        // Modal will open, but playback won't start automatically. User can pick an episode.
      }
  
      if (onInitialActionConsumed) {
        onInitialActionConsumed();
      }
      setProcessingInitialAction(false);
    }
  
    if (!isOpen || !item) {
        hasTriggeredInitialPlay.current = false;
    }
  
  }, [
    isOpen, initialAction, item, activePlayerInfo, serverSelectionInfo,
    promptOrPlay, onInitialActionConsumed, toast, processingInitialAction
  ]);

  const handleReady = useCallback((player: PlyrJS, storageKey: string) => {
    try {
      const savedProgressString = localStorage.getItem(storageKey);
      if (savedProgressString) {
        const savedProgress: ProgressData = JSON.parse(savedProgressString);
        if (player.duration > 0 && savedProgress.time > 0 && savedProgress.time < player.duration) {
          player.currentTime = savedProgress.time;
        }
      }
    } catch (e) {
      console.error("Error loading video progress from localStorage:", e);
    }
  }, []);

  const handlePause = useCallback((player: PlyrJS, storageKey: string) => {
    saveVideoProgress(player, storageKey);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
  }, [saveVideoProgress]);

  const handlePlayerPlay = useCallback((player: PlyrJS, storageKey: string) => {
    setIsPlayerLoading(true); // Initially set to true, playing event will set to false
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    progressIntervalRef.current = setInterval(() => {
      saveVideoProgress(player, storageKey);
    }, 5000);
  }, [saveVideoProgress]);
  
  const handleEnded = useCallback((storageKey: string) => {
      try {
          localStorage.removeItem(storageKey);
      } catch(e) {
          console.error("Error removing progress on video end:", e);
      }
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      setIsPlayerLoading(false);
  }, []);

  const handlePlyrError = useCallback((event: any) => {
      const error = event.detail?.plyr?.source?.error || event.detail?.error || event.error;
      console.error("Plyr error event:", event);
      console.error("Detailed Plyr error:", error);
      let userMessage = "Ocorreu um erro ao tentar reproduzir o vídeo.";
      if (error && typeof error.message === 'string') {
          userMessage += ` Detalhe: ${error.message}`;
      } else if (typeof error === 'string') {
          userMessage += ` Detalhe: ${error}`;
      } else {
          userMessage += " Verifique o link ou tente outra fonte.";
      }
      toast({ title: "Erro de Reprodução", description: userMessage, variant: "destructive" });
      setIsPlayerLoading(false);
  }, [toast]);

  const handlePlayerWaiting = useCallback(() => {
    setIsPlayerLoading(true);
  }, []);

  const handlePlayerPlaying = useCallback(() => {
    setIsPlayerLoading(false);
  }, []);


  useEffect(() => {
    const playerInstance = plyrRef.current?.plyr;

    if (!playerInstance || !activePlayerInfo) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      return;
    }
    
    const validPlayer = playerInstance;
    const { storageKey } = activePlayerInfo;

    // Ensure methods exist before attaching listeners
    const onReady = () => handleReady(validPlayer, storageKey);
    const onPauseEvent = () => handlePause(validPlayer, storageKey); // Renamed
    const onPlayEvent = () => handlePlayerPlay(validPlayer, storageKey);
    const onEndedEvent = () => handleEnded(storageKey); // Renamed
    const onErrorEvent = (event: any) => handlePlyrError(event); // Renamed
    const onWaitingEvent = () => handlePlayerWaiting(); // Renamed
    const onPlayingEvent = () => handlePlayerPlaying(); // Renamed


    if (typeof validPlayer.on === 'function') {
        validPlayer.on('ready', onReady as PlyrJS.PlyrEventCallback);
        validPlayer.on('pause', onPauseEvent as PlyrJS.PlyrEventCallback);
        validPlayer.on('play', onPlayEvent as PlyrJS.PlyrEventCallback);
        validPlayer.on('ended', onEndedEvent as PlyrJS.PlyrEventCallback);
        validPlayer.on('error', onErrorEvent as PlyrJS.PlyrEventCallback);
        validPlayer.on('waiting', onWaitingEvent as PlyrJS.PlyrEventCallback);
        validPlayer.on('playing', onPlayingEvent as PlyrJS.PlyrEventCallback);
    }


    return () => {
      if (validPlayer && typeof validPlayer.off === 'function') {
        validPlayer.off('ready', onReady as PlyrJS.PlyrEventCallback);
        validPlayer.off('pause', onPauseEvent as PlyrJS.PlyrEventCallback);
        validPlayer.off('play', onPlayEvent as PlyrJS.PlyrEventCallback);
        validPlayer.off('ended', onEndedEvent as PlyrJS.PlyrEventCallback);
        validPlayer.off('error', onErrorEvent as PlyrJS.PlyrEventCallback);
        validPlayer.off('waiting', onWaitingEvent as PlyrJS.PlyrEventCallback);
        validPlayer.off('playing', onPlayingEvent as PlyrJS.PlyrEventCallback);
      }

      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      if (validPlayer && typeof validPlayer.stop === 'function' && validPlayer.currentTime > 0 && activePlayerInfo && activePlayerInfo.storageKey) {
         saveVideoProgress(validPlayer, activePlayerInfo.storageKey);
      }
    };
  }, [activePlayerInfo, saveVideoProgress, handleReady, handlePause, handlePlayerPlay, handleEnded, handlePlyrError, handlePlayerWaiting, handlePlayerPlaying]);


  if (!item && !(processingInitialAction && initialAction === 'play')) return null;


  if (activePlayerInfo) {
    return (
      <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-2 sm:p-4">
        <div className="w-full max-w-4xl overflow-hidden">
          <div className="flex justify-between items-center p-3 sm:p-4">
            <h2 className="text-lg sm:text-xl font-semibold text-[hsl(var(--neon-green-accent))] truncate">
              {activePlayerInfo.title}
            </h2>
            <Button variant="ghost" size="icon" onClick={handlePlayerClose} aria-label="Fechar player">
              <X className="h-5 w-5 text-[hsl(var(--neon-green-accent))] hover:text-[hsl(var(--cyberpunk-highlight))]" />
            </Button>
          </div>
          <div className="aspect-video w-full relative">
            <Plyr
              key={activePlayerInfo.storageKey}
              ref={plyrRef}
              source={activePlayerInfo.plyrSource}
              options={{
                autoplay: true,
                playsinline: true,
              }}
            />
            {isPlayerLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-10 pointer-events-none">
                <Loader2 className="h-12 w-12 animate-spin text-white mb-4" />
                <p className="text-white text-xl font-semibold">Carregando...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  if (!item) {
      return ( 
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleModalClose()}>
           <DialogContent className="sm:max-w-[600px] md:max-w-[800px] lg:max-w-[900px] p-0 max-h-[90vh] flex flex-col bg-card">
              <>
                <DialogHeader className="sr-only">
                    <DialogTitle>Carregando conteúdo</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center justify-center flex-grow p-6 min-h-[300px]">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                    <p className="text-muted-foreground">Carregando...</p>
                </div>
              </>
            </DialogContent>
        </Dialog>
      );
  }

  const mediaTypeLabel = item.contentType === 'movie' ? 'Filme' : 'Série';
  const mediaTypeIcon = item.contentType === 'movie'
    ? <Film className="mr-1.5 h-4 w-4 inline-block" />
    : <Tv className="mr-1.5 h-4 w-4 inline-block" />;
  
  const isCurrentlyFavorite = isFavorite(item.id);
  
  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleModalClose()}>
        <DialogContent className="sm:max-w-[600px] md:max-w-[800px] lg:max-w-[900px] p-0 max-h-[90vh] flex flex-col bg-card">
           {processingInitialAction && !item ? ( 
             <>
              <DialogHeader className="sr-only">
                <DialogTitle>Carregando detalhes do conteúdo</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col items-center justify-center flex-grow p-6 min-h-[300px]">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Carregando...</p>
              </div>
             </>
           ) : (
            <>
              {item.bannerFundo && (
                <div className="relative h-48 md:h-64 w-full flex-shrink-0">
                  <Image
                    src={item.bannerFundo}
                    alt={`Banner de ${item.tituloOriginal}`}
                    layout="fill"
                    objectFit="cover"
                    className="rounded-t-md"
                    data-ai-hint="movie scene tv series background"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/80 to-transparent" />
                </div>
              )}
              <div className="flex-grow overflow-y-auto">
                <DialogHeader className={`p-6 ${item.bannerFundo ? 'pt-2 sm:pt-4 -mt-16 sm:-mt-20 relative z-10' : 'pt-6'}`}>
                  <DialogTitle className="text-2xl md:text-3xl font-bold text-foreground drop-shadow-sm">
                    {item.tituloOriginal}
                  </DialogTitle>
                  {item.tituloLocalizado && item.tituloLocalizado !== item.tituloOriginal && (
                    <DialogDescription className="text-lg text-muted-foreground drop-shadow-sm">
                      {item.tituloLocalizado}
                    </DialogDescription>
                  )}
                </DialogHeader>

                <div className={`px-6 pb-6 grid grid-cols-1 md:grid-cols-3 gap-6`}>
                  <div className="md:col-span-1 flex-shrink-0">
                    <Image
                      src={item.capaPoster || `https://placehold.co/300x450.png?text=${encodeURIComponent(item.tituloOriginal)}`}
                      alt={`Poster de ${item.tituloOriginal}`}
                      width={300}
                      height={450}
                      className="rounded-lg shadow-xl w-full h-auto max-w-xs mx-auto md:max-w-full"
                      data-ai-hint={item.contentType === 'movie' ? "movie poster" : "tv show poster"}
                    />
                    <div className="flex flex-col space-y-2 mt-4">
                      <Button 
                        variant="outline" 
                        className="w-full cyberpunk-button-secondary"
                        onClick={() => toggleFavorite(item)}
                        aria-label={isCurrentlyFavorite ? "Remover dos Favoritos" : "Adicionar aos Favoritos"}
                      >
                        <Heart className={cn("mr-2 h-5 w-5", isCurrentlyFavorite && "fill-current text-[hsl(var(--cyberpunk-highlight))]")} />
                        {isCurrentlyFavorite ? "Favoritado" : "Favoritar"}
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full cyberpunk-button-primary"
                        onClick={() => setIsFeedbackDialogOpen(true)}
                      >
                        <MessageCircleQuestion className="mr-2 h-5 w-5" /> Reportar/Pedir
                      </Button>
                    </div>
                  </div>
                  <div className="md:col-span-2 space-y-4">
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground items-center">
                      <span>{mediaTypeIcon}{mediaTypeLabel}</span>
                      {item.anoLancamento && (<><span className="text-xs">&bull;</span><span>{item.anoLancamento}</span></>)}
                      {item.duracaoMedia && (<><span className="text-xs">&bull;</span><span>{item.duracaoMedia} min {item.contentType === 'series' ? '(média ep.)' : ''}</span></>)}
                      {item.classificacaoIndicativa && (<><span className="text-xs">&bull;</span><Badge variant="outline" className="text-xs px-1.5 py-0.5">{item.classificacaoIndicativa}</Badge></>)}
                    </div>
                    {item.sinopse && (<div><h4 className="font-semibold text-md mb-1 text-primary">Sinopse</h4><p className="text-sm text-foreground/90 leading-relaxed max-h-40 overflow-y-auto pr-2">{item.sinopse}</p></div>)}
                    {item.generos && (<div><h4 className="font-semibold text-md mb-1.5 text-primary">Gêneros</h4><div className="flex flex-wrap gap-2">{item.generos.split(',').map(g => g.trim()).filter(Boolean).map(genre => (<Badge key={genre} variant="secondary">{genre}</Badge>))}</div></div>)}
                    <div className="space-y-1 text-sm pt-2">
                      {item.qualidade && <div className="flex items-center"><strong>Qualidade:</strong> <Badge variant="outline" className="ml-2">{item.qualidade}</Badge></div>}
                      {item.contentType === 'series' && (item as StoredSeriesItem).totalTemporadas !== undefined && (item as StoredSeriesItem).totalTemporadas !== null && (<p><strong>Temporadas:</strong> {(item as StoredSeriesItem).totalTemporadas}</p>)}
                      {item.idiomaOriginal && <p><strong>Idioma Original:</strong> {item.idiomaOriginal}</p>}
                      {item.dublagensDisponiveis && <p><strong>Dublagens:</strong> {item.dublagensDisponiveis}</p>}
                    </div>

                    {item.contentType === 'movie' && (item as StoredMovieItem).videoSources && (item as StoredMovieItem).videoSources.filter(vs => vs.url && vs.url.trim() !== '').length > 0 && (
                      <Button
                        onClick={() => promptOrPlay((item as StoredMovieItem).videoSources, item.tituloOriginal, (item as StoredMovieItem).linkLegendas, item.id)}
                        className="mt-4 w-full sm:w-auto cyberpunk-button-primary font-semibold shadow-lg"
                        size="lg"
                      >
                        <PlayCircle className="mr-2 h-5 w-5" /> Assistir Filme
                      </Button>
                    )}

                    {item.contentType === 'series' && (item as StoredSeriesItem).temporadas && (item as StoredSeriesItem).temporadas.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-semibold text-md mb-2 text-primary">Temporadas e Episódios</h4>
                        <Accordion type="single" collapsible className="w-full">
                          {((item as StoredSeriesItem).temporadas).sort((a, b) => a.numeroTemporada - b.numeroTemporada).map((season, seasonIndex) => (
                            <AccordionItem value={`season-${season.numeroTemporada}`} key={`season-${season.id || `s${seasonIndex}`}`}>
                              <AccordionTrigger>Temporada {season.numeroTemporada}</AccordionTrigger>
                              <AccordionContent>
                                {season.episodios && season.episodios.length > 0 ? (
                                  <ul className="space-y-3 pl-2">
                                    {season.episodios.map((episode, episodeIndex) => (
                                      <li key={`episode-${episode.id || `e${episodeIndex}`}`} className="p-3 border rounded-md bg-muted/30">
                                        <div className="flex justify-between items-start">
                                          <div>
                                            <p className="font-medium text-sm flex items-center"><Clapperboard className="mr-2 h-4 w-4 text-primary/80" />Ep. {episodeIndex + 1}: {episode.titulo}</p>
                                            {episode.duracao && (<p className="text-xs text-muted-foreground flex items-center mt-0.5"><Clock className="mr-1.5 h-3 w-3" /> {episode.duracao} min</p>)}
                                          </div>
                                          {episode.videoSources && episode.videoSources.filter(vs => vs.url && vs.url.trim() !== '').length > 0 && (
                                             <Button 
                                                variant="ghost" size="sm"
                                                className="text-primary hover:text-primary/80"
                                                onClick={() => promptOrPlay(episode.videoSources, `${item.tituloOriginal} - T${season.numeroTemporada}E${episodeIndex + 1}: ${episode.titulo}`, episode.linkLegenda, item.id, season.numeroTemporada, episodeIndex)}
                                             >
                                              <PlayCircle className="mr-1.5 h-4 w-4" /> Assistir
                                            </Button>
                                          )}
                                        </div>
                                        {episode.descricao && (<p className="text-xs text-muted-foreground mt-1.5 pt-1.5 border-t border-border/50">{episode.descricao}</p>)}
                                      </li>
                                    ))}
                                  </ul>
                                ) : (<p className="text-sm text-muted-foreground pl-2">Nenhum episódio cadastrado.</p>)}
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </div>
                    )}
                    {item.contentType === 'series' && (!(item as StoredSeriesItem).temporadas || (item as StoredSeriesItem).temporadas.length === 0) && (<p className="text-sm text-muted-foreground mt-4">Nenhuma temporada ou episódio cadastrado.</p>)}
                  </div>
                </div>
              </div>
              <DialogFooter className="p-4 border-t bg-muted/50 rounded-b-md flex-shrink-0">
                <DialogClose asChild><Button variant="outline" onClick={handleModalClose} className="cyberpunk-button-cancel">Fechar</Button></DialogClose>
              </DialogFooter>
            </>
           )}
        </DialogContent>
      </Dialog>

      {serverSelectionInfo && (
        <AlertDialog open={!!serverSelectionInfo} onOpenChange={(open) => !open && setServerSelectionInfo(null)}>
          <AlertDialogContent className="cyberpunk-alert-dialog-content">
            <AlertDialogHeader>
              <AlertDialogTitleComponent className="cyberpunk-alert-dialog-title">Selecionar Servidor</AlertDialogTitleComponent>
              <AlertDialogDescription className="cyberpunk-alert-dialog-description">
                Escolha uma fonte para assistir: "{serverSelectionInfo.title}"
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex flex-col space-y-2 max-h-60 overflow-y-auto py-2">
              {serverSelectionInfo.sources.map((source, index) => (
                <Button
                  key={source.id || `${source.url}-${index}`}
                  className="cyberpunk-button-primary w-full justify-start text-left py-2.5 px-4"
                  onClick={() => initiatePlayback(
                    source.url,
                    serverSelectionInfo.title,
                    serverSelectionInfo.subtitleUrl,
                    serverSelectionInfo.baseId,
                    serverSelectionInfo.seasonNumber,
                    serverSelectionInfo.episodeIndex
                  )}
                >
                  <ListVideo className="mr-2 h-4 w-4" /> {source.serverName || `Servidor ${index + 1}`}
                </Button>
              ))}
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel 
                onClick={() => setServerSelectionInfo(null)}
                className="cyberpunk-button-cancel"
              >
                Cancelar
              </AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      
      {item && (
        <FeedbackDialog
            isOpen={isFeedbackDialogOpen}
            onClose={() => setIsFeedbackDialogOpen(false)}
            contentContext={{ id: item.id, title: item.tituloOriginal }}
        />
      )}
    </>
  );
}


    
