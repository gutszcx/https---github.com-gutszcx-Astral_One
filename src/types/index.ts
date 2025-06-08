
// src/types/index.ts
import type { CineFormValues, VideoSource as FormVideoSourceSchema, EpisodeFormValues as OriginalEpisodeFormValues, SeasonFormValues as OriginalSeasonFormValues } from '@/lib/schemas';

// Updated VideoSource type for storage, reflecting new schema
export interface VideoSource {
  id?: string; 
  serverName: string;
  sourceType: 'directUrl' | 'embedCode';
  content: string; // Holds URL or embed code
}

// StoredEmbedUrl is no longer needed as it's merged into VideoSource
// export interface StoredEmbedUrl { ... }

export interface Episode {
  id?: string; 
  titulo: string;
  descricao: string; 
  duracao: number | null; 
  videoSources: VideoSource[]; // Uses the new VideoSource type
  linkLegenda: string; 
}

export interface Season {
  id?: string; 
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
  // embedUrls?: StoredEmbedUrl[]; // Removed
  createdAt?: string; // ISO string date
  updatedAt?: string; // ISO string date
}

export type StoredMovieItem = StoredBaseCineItem & {
  contentType: 'movie';
  videoSources: VideoSource[]; // Uses the new VideoSource type
  linkLegendas: string;
};

export type StoredSeriesItem = StoredBaseCineItem & {
  contentType: 'series';
  totalTemporadas: number | null;
  temporadas: Season[];
};

export type StoredCineItem = StoredMovieItem | StoredSeriesItem;

// Export form types for use elsewhere if needed, but primarily we use Stored types for fetched data
export type { CineFormValues, FormVideoSourceSchema as FormVideoSource, OriginalEpisodeFormValues, OriginalSeasonFormValues }; // Removed FormEmbedUrlItem

// News Banner Types
export const NEWS_BANNER_TYPES = ['none', 'info', 'success', 'warning', 'error'] as const;
export type NewsBannerMessageType = (typeof NEWS_BANNER_TYPES)[number];

export interface NewsBannerMessage {
  id?: string; 
  message: string;
  type: NewsBannerMessageType;
  isActive: boolean;
  link?: string;
  linkText?: string;
  updatedAt?: string; // ISO string date
}

// User Feedback Types
export const FEEDBACK_TYPES = [
  "pedido_conteudo",
  "episodio_offline",
  "problema_geral",
  "outro"
] as const;
export type FeedbackType = (typeof FEEDBACK_TYPES)[number];

export const FEEDBACK_STATUSES = [
  "novo",
  "em_analise",
  "resolvido",
  "recusado"
] as const;
export type FeedbackStatus = (typeof FEEDBACK_STATUSES)[number];

export interface UserFeedbackItem {
  id: string;
  userId?: string; 
  contentId?: string; 
  contentTitle?: string; 
  feedbackType: FeedbackType;
  message: string;
  status: FeedbackStatus;
  adminResponse?: string;
  submittedAt: string; // ISO string date
  respondedAt?: string; // ISO string date
}
