
// src/components/homeani/HomeAniDetailModal.tsx
'use client';

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
import type { StoredCineItem, EpisodeFormValues, SeasonFormValues } from '@/types';
import { Film, Tv, Clapperboard, Clock } from 'lucide-react';
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

export function HomeAniDetailModal({ item, isOpen, onClose }: HomeAniDetailModalProps) {

  const handleCloseModal = () => {
    onClose();
  };

  if (!item) return null;

  const mediaTypeLabel = item.contentType === 'movie' ? 'Filme' : 'Série';
  const mediaTypeIcon = item.contentType === 'movie'
    ? <Film className="mr-1.5 h-4 w-4 inline-block" />
    : <Tv className="mr-1.5 h-4 w-4 inline-block" />;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCloseModal()}>
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

              {/* "Assistir Filme" button removed for movies */}

              {item.contentType === 'series' && item.temporadas && item.temporadas.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold text-md mb-2 text-primary">Temporadas e Episódios</h4>
                  <Accordion type="single" collapsible className="w-full">
                    {(item.temporadas as SeasonFormValues[]).sort((a, b) => a.numeroTemporada - b.numeroTemporada).map((season, seasonIndex) => (
                      <AccordionItem value={`season-${season.numeroTemporada}`} key={`season-${season.id || `s${seasonIndex}`}`}>
                        <AccordionTrigger>Temporada {season.numeroTemporada}</AccordionTrigger>
                        <AccordionContent>
                          {season.episodios && season.episodios.length > 0 ? (
                            <ul className="space-y-3 pl-2">
                              {(season.episodios as EpisodeFormValues[]).map((episode, episodeIndex) => (
                                <li key={`episode-${episode.id || `e${episodeIndex}`}`} className="p-3 border rounded-md bg-muted/30">
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
                                    {/* "Assistir" button for episodes removed */}
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
