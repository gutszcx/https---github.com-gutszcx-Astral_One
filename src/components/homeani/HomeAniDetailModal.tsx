
// src/components/homeani/HomeAniDetailModal.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { StoredCineItem, SeasonFormValues, EpisodeFormValues } from '@/types';
import { PlayCircle, Film, Tv, Clapperboard, Clock, X } from 'lucide-react'; // Changed XCircle to X
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

interface HomeAniDetailModalProps {
  item: StoredCineItem | null;
  isOpen: boolean;
  onClose: () => void;
}

const determineVideoType = (url: string): string => {
  if (url.endsWith('.m3u8')) {
    return 'application/vnd.apple.mpegurl';
  }
  if (url.endsWith('.mp4')) {
    return 'video/mp4';
  }
  return 'video/mp4';
};


export function HomeAniDetailModal({ item, isOpen, onClose }: HomeAniDetailModalProps) {
  const [currentVideoInfo, setCurrentVideoInfo] = useState<{ url: string; storageKey: string; title: string } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleWatchClick = (url: string | undefined | null, storageKey: string, title: string) => {
    if (url) {
      setCurrentVideoInfo({ url, storageKey, title });
    }
  };

  const closePlayerAndSaveProgress = () => {
    const videoElement = videoRef.current;
    if (videoElement && currentVideoInfo?.storageKey && videoElement.currentTime > 0 && isFinite(videoElement.duration)) {
      try {
        localStorage.setItem(currentVideoInfo.storageKey, String(videoElement.currentTime));
      } catch (e) {
        console.error("Error saving video progress to localStorage:", e);
      }
    }
    setCurrentVideoInfo(null);
  };

  const handleCloseModal = () => {
    closePlayerAndSaveProgress();
    onClose();
  };

  const handleClosePlayerButton = () => {
    closePlayerAndSaveProgress();
  };

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement || !currentVideoInfo?.url || !currentVideoInfo?.storageKey) {
      return;
    }

    let isMounted = true;

    const saveProgress = () => {
      if (videoElement && videoElement.currentTime > 0 && currentVideoInfo?.storageKey && isFinite(videoElement.duration)) {
        try {
          localStorage.setItem(currentVideoInfo.storageKey, String(videoElement.currentTime));
        } catch (e) {
          console.error("Error saving video progress to localStorage:", e);
        }
      }
    };

    const handleLoadedMetadata = () => {
      if (!isMounted || !currentVideoInfo?.storageKey) return;
      try {
        const savedTime = localStorage.getItem(currentVideoInfo.storageKey);
        if (savedTime) {
          videoElement.currentTime = parseFloat(savedTime);
        }
      } catch (e) {
        console.error("Error loading video progress from localStorage:", e);
      }
    };

    const intervalId = setInterval(() => {
      if (videoElement && !videoElement.paused && !videoElement.ended) {
        saveProgress();
      }
    }, 5000);

    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    videoElement.addEventListener('pause', saveProgress);
    videoElement.addEventListener('seeked', saveProgress); 
    videoElement.addEventListener('ended', saveProgress); // Save progress if video ends

    if (videoElement.readyState >= videoElement.HAVE_METADATA) {
      handleLoadedMetadata();
    }

    return () => {
      isMounted = false;
      clearInterval(intervalId);
      saveProgress(); 
      if (videoElement) {
        videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
        videoElement.removeEventListener('pause', saveProgress);
        videoElement.removeEventListener('seeked', saveProgress);
        videoElement.removeEventListener('ended', saveProgress);
      }
    };
  }, [currentVideoInfo]);


  if (!item) return null;

  const mediaTypeLabel = item.contentType === 'movie' ? 'Filme' : 'Série';
  const mediaTypeIcon = item.contentType === 'movie'
    ? <Film className="mr-1.5 h-4 w-4 inline-block" />
    : <Tv className="mr-1.5 h-4 w-4 inline-block" />;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCloseModal()}>
      <DialogContent className="sm:max-w-[600px] md:max-w-[800px] lg:max-w-[900px] p-0 max-h-[90vh] flex flex-col">
        {item.bannerFundo && !currentVideoInfo?.url && (
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
          <DialogHeader className={`p-6 ${item.bannerFundo && !currentVideoInfo?.url ? 'pt-2 sm:pt-4 -mt-16 sm:-mt-20 relative z-10' : 'pt-6'}`}>
            <DialogTitle className="text-2xl md:text-3xl font-bold text-foreground drop-shadow-sm">
              {currentVideoInfo?.title || item.tituloOriginal}
            </DialogTitle>
            {!currentVideoInfo?.title && item.tituloLocalizado && item.tituloLocalizado !== item.tituloOriginal && (
              <DialogDescription className="text-lg text-muted-foreground drop-shadow-sm">
                {item.tituloLocalizado}
              </DialogDescription>
            )}
          </DialogHeader>

          {currentVideoInfo?.url && (
            <div className="relative p-4 md:p-6 bg-black rounded-lg mx-4 md:mx-6 my-4">
              <video
                ref={videoRef}
                key={currentVideoInfo.storageKey}
                width="100%"
                style={{ maxHeight: '60vh', aspectRatio: '16/9', display: 'block' }}
                controls
                autoPlay
                className="rounded-md"
              >
                <source src={currentVideoInfo.url} type={determineVideoType(currentVideoInfo.url)} />
                Seu navegador não suporta a tag de vídeo.
              </video>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClosePlayerButton}
                className="absolute top-1 right-1 md:top-2 md:right-2 z-10 h-8 w-8 bg-black/60 hover:bg-black/80 text-white rounded-full p-1"
                aria-label="Fechar player"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          )}

          <div className={`px-6 pb-6 grid grid-cols-1 md:grid-cols-3 gap-6 ${currentVideoInfo?.url ? 'pt-2' : ''}`}>
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
                {item.anoLancamento && (
                  <>
                    <span className="text-xs">&bull;</span>
                    <span>{item.anoLancamento}</span>
                  </>
                )}
                {item.duracaoMedia && (
                  <>
                    <span className="text-xs">&bull;</span>
                    <span>{item.duracaoMedia} min {item.contentType === 'series' ? '(média ep.)' : ''}</span>
                  </>
                )}
                {item.classificacaoIndicativa && (
                  <>
                    <span className="text-xs">&bull;</span>
                    <Badge variant="outline" className="text-xs px-1.5 py-0.5">{item.classificacaoIndicativa}</Badge>
                  </>
                )}
              </div>

              {item.sinopse && (
                <div>
                  <h4 className="font-semibold text-md mb-1 text-primary">Sinopse</h4>
                  <p className="text-sm text-foreground/90 leading-relaxed max-h-40 overflow-y-auto pr-2">
                    {item.sinopse}
                  </p>
                </div>
              )}

              {item.generos && (
                <div>
                  <h4 className="font-semibold text-md mb-1.5 text-primary">Gêneros</h4>
                  <div className="flex flex-wrap gap-2">
                    {item.generos.split(',').map(genre => genre.trim()).filter(Boolean).map(genre => (
                      <Badge key={genre} variant="secondary">{genre}</Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-1 text-sm pt-2">
                {item.qualidade &&
                    <div className="flex items-center"><strong>Qualidade:</strong> <Badge variant="outline" className="ml-2">{item.qualidade}</Badge></div>
                }
                {item.contentType === 'series' && item.totalTemporadas !== undefined && item.totalTemporadas !== null && (
                  <p><strong>Temporadas:</strong> {item.totalTemporadas}</p>
                )}
                {item.idiomaOriginal && <p><strong>Idioma Original:</strong> {item.idiomaOriginal}</p>}
                {item.dublagensDisponiveis && <p><strong>Dublagens:</strong> {item.dublagensDisponiveis}</p>}
              </div>

              {item.contentType === 'movie' && item.linkVideo && (
                <Button
                  onClick={() => handleWatchClick(
                    item.linkVideo,
                    `video-progress-${item.id}`,
                    item.tituloOriginal
                  )}
                  className="mt-4 w-full sm:w-auto"
                >
                  <PlayCircle className="mr-2 h-5 w-5" /> Assistir Filme
                </Button>
              )}

              {item.contentType === 'series' && item.temporadas && item.temporadas.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold text-md mb-2 text-primary">Temporadas e Episódios</h4>
                  <Accordion type="single" collapsible className="w-full">
                    {item.temporadas.sort((a, b) => a.numeroTemporada - b.numeroTemporada).map((season, seasonIndex) => (
                      <AccordionItem value={`season-${season.numeroTemporada}`} key={`season-${season.id || seasonIndex}`}>
                        <AccordionTrigger>Temporada {season.numeroTemporada}</AccordionTrigger>
                        <AccordionContent>
                          {season.episodios && season.episodios.length > 0 ? (
                            <ul className="space-y-3 pl-2">
                              {season.episodios.map((episode, episodeIndex) => (
                                <li key={`episode-${episode.id || episodeIndex}`} className="p-3 border rounded-md bg-muted/30">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <p className="font-medium text-sm flex items-center">
                                        <Clapperboard className="mr-2 h-4 w-4 text-primary/80" />
                                        Ep. {episodeIndex + 1}: {episode.titulo}
                                      </p>
                                      {episode.duracao && (
                                        <p className="text-xs text-muted-foreground flex items-center mt-0.5">
                                          <Clock className="mr-1.5 h-3 w-3" /> {episode.duracao} min
                                        </p>
                                      )}
                                    </div>
                                    {episode.linkVideo && (
                                      <Button
                                        onClick={() => handleWatchClick(
                                          episode.linkVideo,
                                          `video-progress-${item.id}-s${season.numeroTemporada}-e${episodeIndex}`,
                                          `${item.tituloOriginal} - T${season.numeroTemporada}E${episodeIndex + 1}: ${episode.titulo}`
                                        )}
                                        size="sm"
                                        variant="outline"
                                        className="ml-2 shrink-0"
                                      >
                                        <PlayCircle className="mr-1.5 h-4 w-4" /> Assistir
                                      </Button>
                                    )}
                                  </div>
                                  {episode.descricao && (
                                    <p className="text-xs text-muted-foreground mt-1.5 pt-1.5 border-t border-border/50">
                                      {episode.descricao}
                                    </p>
                                  )}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-muted-foreground pl-2">Nenhum episódio cadastrado para esta temporada.</p>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              )}
              {item.contentType === 'series' && (!item.temporadas || item.temporadas.length === 0) && (
                 <p className="text-sm text-muted-foreground mt-4">Nenhuma temporada ou episódio cadastrado.</p>
              )}

            </div>
          </div>
        </div>
        <DialogFooter className="p-4 border-t bg-muted/50 rounded-b-md flex-shrink-0">
          <DialogClose asChild>
            <Button variant="outline" onClick={handleCloseModal}>Fechar</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

