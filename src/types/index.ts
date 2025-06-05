// src/types/index.ts
import type { CineFormValues, SeasonFormValues as OriginalSeasonFormValues, EpisodeFormValues as OriginalEpisodeFormValues, VideoSource as OriginalVideoSource } from '@/lib/schemas';

export type VideoSource = OriginalVideoSource;
export type EpisodeFormValues = OriginalEpisodeFormValues;
export type SeasonFormValues = OriginalSeasonFormValues;
export type { CineFormValues };


// StoredCineItem needs to be compatible with the discriminated union
// It might be better to define movie and series specific stored items if they diverge significantly

export type StoredMovieItem = Extract<CineFormValues, { contentType: 'movie' }> & {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  // Ensure videoSources is always present
  videoSources: OriginalVideoSource[]; 
};

export type StoredSeriesItem = Extract<CineFormValues, { contentType: 'series' }> & {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  temporadas: Array<Omit<OriginalSeasonFormValues, 'episodios'> & {
    episodios: Array<Omit<OriginalEpisodeFormValues, 'videoSources'> & {
      videoSources: OriginalVideoSource[];
    }>;
  }>;
};

export type StoredCineItem = StoredMovieItem | StoredSeriesItem;