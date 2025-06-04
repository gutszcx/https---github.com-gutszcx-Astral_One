// src/types/index.ts
import type { CineFormValues, SeasonFormValues as OriginalSeasonFormValues, EpisodeFormValues as OriginalEpisodeFormValues } from '@/lib/schemas';

// Re-export or redefine SeasonFormValues and EpisodeFormValues if they are needed by other parts of the app
// that expect them directly from types. For HomeAniDetailModal, we can import them from schemas.
export type { CineFormValues };

export type EpisodeFormValues = OriginalEpisodeFormValues;
export type SeasonFormValues = OriginalSeasonFormValues;


export interface StoredCineItem extends CineFormValues {
  id: string;
  createdAt?: string; 
  updatedAt?: string; 
}
