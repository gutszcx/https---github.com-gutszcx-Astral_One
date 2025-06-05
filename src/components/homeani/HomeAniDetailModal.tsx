// src/components/homeani/HomeAniDetailModal.tsx
'use client';

import Image from 'next/image';
import { useState, useEffect, useRef, useCallback } from 'react';
import Hls from 'hls.js';
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
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { StoredCineItem, StoredMovieItem, StoredSeriesItem, VideoSource, EpisodeFormValues, SeasonFormValues } from '@/types';
import { Film, Tv, Clapperboard, Clock, PlayCircle, X, ListVideo } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useToast } from '@/hooks/use-toast';

interface HomeAniDetailModalProps {
  item: StoredCineItem | null;
  isOpen: boolean;
  onClose: () => void;
}

interface PlayerInfo {
  videoUrl: string;
  subtitleUrl?: string;
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

export function HomeAniDetailModal({ item, isOpen, onClose }: HomeAniDetailModalProps) {
  const [activePlayerInfo, setActivePlayerInfo] = useState<PlayerInfo | null>(null);
  const [serverSelectionInfo, setServerSelectionInfo] = useState<ServerSelectionInfo | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const handleModalClose = () => {
    if (videoRef.current && activePlayerInfo) {
      saveVideoProgress(videoRef.current, activePlayerInfo.storageKey);
    }
    setActivePlayerInfo(null);
    setServerSelectionInfo(null);
    onClose();
  };

  const handlePlayerClose = () => {
    if (videoRef.current && activePlayerInfo) {
      saveVideoProgress(videoRef.current, activePlayerInfo.storageKey);
    }
    setActivePlayerInfo(null);
  };
  
  const saveVideoProgress = useCallback((videoElement: HTMLVideoElement, storageKey: string) => {
    if (!videoElement || !storageKey || Number.isNaN(videoElement.currentTime) || Number.isNaN(videoElement.duration)) return;
    try {
      const progressData: ProgressData = {
        time: videoElement.currentTime,
        duration: videoElement.duration,
        lastSaved: Date.now(),
      };
      localStorage.setItem(storageKey, JSON.stringify(progressData));
    } catch (e) {
      console.error("Error saving video progress to localStorage:", e);
    }
  }, []);

  const initiatePlayback = (
    videoUrl: string, 
    title: string, 
    subtitleUrl?: string, 
    baseId?: string, 
    seasonNumber?: number, 
    episodeIndex?: number
  ) => {
    if (!baseId) { // Should always have baseId if we reach here
        console.error("Cannot initiate playback without a baseId for storageKey.");
        toast({ title: "Erro Interno", description: "Não foi possível identificar o conteúdo para salvar progresso.", variant: "destructive"});
        return;
    }
    let storageKey = `video-progress-${baseId}`;
    if (typeof seasonNumber === 'number' && typeof episodeIndex === 'number') {
      storageKey += `-s${seasonNumber}-e${episodeIndex}`;
    }
    setActivePlayerInfo({ videoUrl, subtitleUrl, title, storageKey });
    setServerSelectionInfo(null); // Close server selection dialog if open
  };


  const promptOrPlay = (
    sources: VideoSource[] | undefined, 
    title: string, 
    subtitleUrl?: string, 
    baseId?: string, // item.id
    seasonNumber?: number, 
    episodeIndex?: number 
  ) => {
    if (!baseId) {
      toast({ title: "Conteúdo Inválido", description: "ID do conteúdo não encontrado.", variant: "destructive" });
      return;
    }
    if (!sources || sources.length === 0) {
      toast({ title: "Sem Fontes de Vídeo", description: "Nenhum link de vídeo disponível para este conteúdo.", variant: "default" });
      return;
    }
    const validSources = sources.filter(s => s.url && s.url.trim() !== '');
    if (validSources.length === 0) {
        toast({ title: "Sem Fontes de Vídeo Válidas", description: "Nenhum link de vídeo válido encontrado.", variant: "default" });
        return;
    }

    if (validSources.length === 1) {
      initiatePlayback(validSources[0].url, title, subtitleUrl, baseId, seasonNumber, episodeIndex);
    } else {
      setServerSelectionInfo({ sources: validSources, subtitleUrl, title, baseId, seasonNumber, episodeIndex });
    }
  };

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement || !activePlayerInfo) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if(progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      return;
    }

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    if(progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }

    const videoSrc = activePlayerInfo.videoUrl;

    if (videoSrc.endsWith('.m3u8') || videoSrc.includes('.m3u8?')) {
      if (Hls.isSupported()) {
        const hls = new Hls();
        hlsRef.current = hls;
        hls.loadSource(videoSrc);
        hls.attachMedia(videoElement);
        hls.on(Hls.Events.ERROR, function (event, data) {
          console.error('HLS.js error event:', event, 'data:', data);
          if (data.fatal) {
            console.error('HLS.js fatal error:', data.type, data.details);
            let userMessage = "Ocorreu um erro ao tentar reproduzir o vídeo. Tente novamente mais tarde.";
            if (data.type === Hls.ErrorTypes.NETWORK_ERROR && (data.details === Hls.ErrorDetails.MANIFEST_LOAD_ERROR || data.details === Hls.ErrorDetails.MANIFEST_LOAD_TIMEOUT)) {
                userMessage = "Erro ao carregar o vídeo (manifest). Verifique o link ou a sua conexão com a internet.";
            } else if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                userMessage = "Erro de rede ao carregar o vídeo. Verifique sua conexão.";
            } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
               userMessage = "Erro na reprodução do vídeo. O formato pode não ser suportado ou o arquivo está corrompido.";
            }
            toast({ title: "Erro de Reprodução (HLS)", description: userMessage, variant: "destructive" });
          } else {
            console.warn('HLS.js non-fatal error:', data.type, data.details);
          }
        });
      } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
        videoElement.src = videoSrc;
      } else {
        toast({ title: "Formato Não Suportado", description: "Seu navegador não suporta a reprodução deste formato de vídeo (HLS).", variant: "destructive" });
      }
    } else { 
      videoElement.src = videoSrc;
    }
    
    videoElement.load(); 

    const handleLoadedMetadata = () => {
      try {
        const savedProgressString = localStorage.getItem(activePlayerInfo.storageKey);
        if (savedProgressString) {
          const savedProgress: ProgressData = JSON.parse(savedProgressString);
          if (savedProgress.time > 0 && savedProgress.time < videoElement.duration) {
            videoElement.currentTime = savedProgress.time;
          }
        }
      } catch (e) {
        console.error("Error loading video progress from localStorage:", e);
      }
       videoElement.play().catch(error => console.warn("Autoplay prevented:", error));
    };

    const handlePause = () => {
      saveVideoProgress(videoElement, activePlayerInfo.storageKey);
       if(progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
    
    const handlePlay = () => {
      if(progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = setInterval(() => {
        saveVideoProgress(videoElement, activePlayerInfo.storageKey);
      }, 5000); 
    };

    const handleEnded = () => {
        try {
            localStorage.removeItem(activePlayerInfo.storageKey); 
        } catch(e) {
            console.error("Error removing progress on video end:", e);
        }
        if(progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };

    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    videoElement.addEventListener('pause', handlePause);
    videoElement.addEventListener('play', handlePlay);
    videoElement.addEventListener('ended', handleEnded);

    return () => {
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.removeEventListener('pause', handlePause);
      videoElement.removeEventListener('play', handlePlay);
      videoElement.removeEventListener('ended', handleEnded);
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if(progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      // Ensure progress is saved if video is active when component unmounts or activePlayerInfo changes
      if (videoElement.currentTime > 0 && activePlayerInfo && videoElement.src) {
         saveVideoProgress(videoElement, activePlayerInfo.storageKey);
      }
    };
  }, [activePlayerInfo, saveVideoProgress, toast]);


  if (!item) return null;

  const mediaTypeLabel = item.contentType === 'movie' ? 'Filme' : 'Série';
  const mediaTypeIcon = item.contentType === 'movie'
    ? <Film className="mr-1.5 h-4 w-4 inline-block" />
    : <Tv className="mr-1.5 h-4 w-4 inline-block" />;

  return (
    <>
      <Dialog open={isOpen && !activePlayerInfo && !serverSelectionInfo} onOpenChange={(open) => !open && handleModalClose()}>
        <DialogContent className="sm:max-w-[600px] md:max-w-[800px] lg:max-w-[900px] p-0 max-h-[90vh] flex flex-col">
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
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
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
                  {item.contentType === 'series' && item.totalTemporadas !== undefined && item.totalTemporadas !== null && (<p><strong>Temporadas:</strong> {item.totalTemporadas}</p>)}
                  {item.idiomaOriginal && <p><strong>Idioma Original:</strong> {item.idiomaOriginal}</p>}
                  {item.dublagensDisponiveis && <p><strong>Dublagens:</strong> {item.dublagensDisponiveis}</p>}
                </div>

                {item.contentType === 'movie' && item.videoSources && item.videoSources.length > 0 && (
                  <Button
                    onClick={() => promptOrPlay(item.videoSources, item.tituloOriginal, item.linkLegendas, item.id)}
                    className="mt-4 w-full sm:w-auto"
                    size="lg"
                  >
                    <PlayCircle className="mr-2 h-5 w-5" /> Assistir Filme
                  </Button>
                )}

                {item.contentType === 'series' && item.temporadas && item.temporadas.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-semibold text-md mb-2 text-primary">Temporadas e Episódios</h4>
                    <Accordion type="single" collapsible className="w-full">
                      {(item.temporadas as StoredSeriesItem['temporadas']).sort((a, b) => a.numeroTemporada - b.numeroTemporada).map((season, seasonIndex) => (
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
                                      {episode.videoSources && episode.videoSources.length > 0 && (
                                         <Button 
                                            variant="outline" size="sm"
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
                {item.contentType === 'series' && (!item.temporadas || item.temporadas.length === 0) && (<p className="text-sm text-muted-foreground mt-4">Nenhuma temporada ou episódio cadastrado.</p>)}
              </div>
            </div>
          </div>
          <DialogFooter className="p-4 border-t bg-muted/50 rounded-b-md flex-shrink-0">
            <DialogClose asChild><Button variant="outline" onClick={handleModalClose}>Fechar</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {serverSelectionInfo && (
        <AlertDialog open={!!serverSelectionInfo} onOpenChange={(open) => !open && setServerSelectionInfo(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Selecionar Servidor</AlertDialogTitle>
              <AlertDialogDescription>
                Escolha uma fonte para assistir: "{serverSelectionInfo.title}"
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex flex-col space-y-2 max-h-60 overflow-y-auto py-2">
              {serverSelectionInfo.sources.map((source) => (
                <Button
                  key={source.id || source.url} // Use URL as part of key if ID isn't there from form context
                  variant="outline"
                  onClick={() => initiatePlayback(
                    source.url, 
                    serverSelectionInfo.title, 
                    serverSelectionInfo.subtitleUrl, 
                    serverSelectionInfo.baseId,
                    serverSelectionInfo.seasonNumber,
                    serverSelectionInfo.episodeIndex
                  )}
                  className="w-full justify-start"
                >
                  <ListVideo className="mr-2 h-4 w-4" /> {source.serverName}
                </Button>
              ))}
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setServerSelectionInfo(null)}>Cancelar</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {activePlayerInfo && (
        <div className="fixed inset-0 bg-black/95 flex flex-col items-center justify-center z-[100] p-2 sm:p-4" role="dialog" aria-modal="true" aria-labelledby="videoPlayerTitle">
          <div className="w-full max-w-5xl bg-black rounded-lg shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center p-2 sm:p-3 bg-black border-b border-gray-700">
                <h2 id="videoPlayerTitle" className="text-sm sm:text-lg font-semibold text-white truncate pl-2">{activePlayerInfo.title}</h2>
                <Button variant="ghost" size="icon" onClick={handlePlayerClose} className="text-gray-300 hover:text-white hover:bg-gray-700 rounded-full" aria-label="Fechar player">
                    <X className="h-5 w-5 sm:h-6 sm:w-6" />
                </Button>
            </div>
            <div className="aspect-video"> 
                <video ref={videoRef} controls autoPlay playsInline crossOrigin="anonymous" className="w-full h-full bg-black" key={activePlayerInfo.videoUrl}>
                    {activePlayerInfo.subtitleUrl && (<track kind="subtitles" src={activePlayerInfo.subtitleUrl} srcLang="pt" label="Português" default />)}
                    Seu navegador não suporta o elemento de vídeo.
                </video>
            </div>
          </div>
        </div>
      )}
    </>
  );
}