
// src/types/index.ts
import type { CineFormValues, VideoSource as FormVideoSource, EpisodeFormValues as OriginalEpisodeFormValues, SeasonFormValues as OriginalSeasonFormValues } from '@/lib/schemas';

// Re-define VideoSource for storage, ensuring consistency if schema changes
export interface VideoSource {
  id?: string; // Optional ID, typically from useFieldArray or if you assign one
  serverName: string;
  url: string;
}

export interface Episode {
  id?: string; // Optional ID
  titulo: string;
  descricao: string; // Optional, but ensure it's string if present
  duracao: number | null; // Optional
  videoSources: VideoSource[];
  linkLegenda: string; // Optional, but ensure it's string if present
}

export interface Season {
  id?: string; // Optional ID
  numeroTemporada: number;
  episodios: Episode[];
}

// Base structure for all stored items
interface StoredBaseCineItem {
  id: string;
  tmdbSearchQuery: string;
  tituloOriginal: string;
  tituloLocalizado: string;
  sinopse: string;
  generos: string;
  idiomaOriginal: string;
  dublagensDisponiveis: string;
  anoLancamento: number | null;
  duracaoMedia: number | null;
  classificacaoIndicativa: string;
  qualidade: string;
  capaPoster: string;
  bannerFundo: string;
  tags: string;
  destaqueHome: boolean;
  status: 'ativo' | 'inativo';
  createdAt?: string; // ISO string date
  updatedAt?: string; // ISO string date
}

export type StoredMovieItem = StoredBaseCineItem & {
  contentType: 'movie';
  videoSources: VideoSource[];
  linkLegendas: string;
};

export type StoredSeriesItem = StoredBaseCineItem & {
  contentType: 'series';
  totalTemporadas: number | null;
  temporadas: Season[];
};

export type StoredCineItem = StoredMovieItem | StoredSeriesItem;

// Export form types for use elsewhere if needed, but primarily we use Stored types for fetched data
export type { CineFormValues, FormVideoSource, OriginalEpisodeFormValues, OriginalSeasonFormValues };

// News Banner Types
export const NEWS_BANNER_TYPES = ['none', 'info', 'success', 'warning', 'error'] as const;
export type NewsBannerMessageType = (typeof NEWS_BANNER_TYPES)[number];

export interface NewsBannerMessage {
  id?: string; // Document ID, typically 'newsBannerControls'
  message: string;
  type: NewsBannerMessageType;
  isActive: boolean;
  link?: string;
  linkText?: string;
  updatedAt?: string; // ISO string date
}
    
