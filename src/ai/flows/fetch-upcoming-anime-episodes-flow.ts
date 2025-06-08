
// src/ai/flows/fetch-upcoming-anime-episodes-flow.ts
'use server';
/**
 * @fileOverview Fetches upcoming anime episodes from TMDB.
 * - fetchUpcomingAnimeEpisodes: Retrieves a list of anime episodes airing soon.
 * - UpcomingTmdbEpisodeInfo: The structure for individual upcoming episode data.
 * - FetchUpcomingAnimeEpisodesOutput: The array type for the flow's output.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { UpcomingTmdbEpisodeInfo, FetchUpcomingAnimeEpisodesOutput } from '@/types';

const TMDB_API_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL_W185 = 'https://image.tmdb.org/t/p/w185'; // For posters in lists

// Define output schema based on UpcomingTmdbEpisodeInfo from '@/types'
const UpcomingTmdbEpisodeInfoSchema = z.object({
  seriesTmdbId: z.number(),
  seriesTitle: z.string(),
  posterUrl: z.string(),
  episodeNumber: z.number(),
  seasonNumber: z.number(),
  airDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  episodeName: z.string(),
  episodeOverview: z.string(),
  seriesOverview: z.string(),
});

const FetchUpcomingAnimeEpisodesOutputSchema = z.array(UpcomingTmdbEpisodeInfoSchema);

// Exported function that calls the flow
export async function fetchUpcomingAnimeEpisodes(): Promise<FetchUpcomingAnimeEpisodesOutput> {
  return fetchUpcomingAnimeEpisodesFlow();
}

const fetchUpcomingAnimeEpisodesFlow = ai.defineFlow(
  {
    name: 'fetchUpcomingAnimeEpisodesFlow',
    inputSchema: z.void(), // No input for now, could add date range later
    outputSchema: FetchUpcomingAnimeEpisodesOutputSchema,
  },
  async (): Promise<FetchUpcomingAnimeEpisodesOutput> => {
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) {
      throw new Error('TMDB_API_KEY is not configured in environment variables.');
    }

    const upcomingEpisodes: UpcomingTmdbEpisodeInfo[] = [];
    const today = new Date();
    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    try {
      // 1. Discover popular/relevant anime series
      // We'll fetch a couple of pages to get a decent selection.
      // Prioritizing Japanese animation, but this could be broadened.
      const discoverUrl = `${TMDB_API_BASE_URL}/discover/tv?api_key=${apiKey}&language=pt-BR&sort_by=popularity.desc&with_genres=16&with_original_language=ja&include_adult=false&page=1`;
      
      const discoverResponse = await fetch(discoverUrl);
      if (!discoverResponse.ok) {
        console.error(`TMDB Discover API error: ${discoverResponse.statusText}`);
        throw new Error(`Failed to discover anime series: ${discoverResponse.statusText}`);
      }
      const discoverData = await discoverResponse.json();
      const seriesToProcess = discoverData.results.slice(0, 20); // Process top 20 for now to manage API calls

      // 2. For each series, fetch its details to find the next episode to air
      for (const series of seriesToProcess) {
        if (!series.id) continue;

        const seriesDetailUrl = `${TMDB_API_BASE_URL}/tv/${series.id}?api_key=${apiKey}&language=pt-BR`;
        const seriesDetailResponse = await fetch(seriesDetailUrl);
        if (!seriesDetailResponse.ok) {
          console.warn(`Failed to fetch details for series ID ${series.id}: ${seriesDetailResponse.statusText}`);
          continue; // Skip this series if details can't be fetched
        }
        const seriesDetailData = await seriesDetailResponse.json();

        if (seriesDetailData.next_episode_to_air) {
          const nextEpisode = seriesDetailData.next_episode_to_air;
          const airDate = new Date(nextEpisode.air_date);

          // Check if air date is in the future and within the next 30 days
          if (airDate >= today && airDate <= thirtyDaysFromNow) {
            upcomingEpisodes.push({
              seriesTmdbId: series.id,
              seriesTitle: seriesDetailData.name || series.name || 'Título Desconhecido',
              posterUrl: seriesDetailData.poster_path
                ? `${TMDB_IMAGE_BASE_URL_W185}${seriesDetailData.poster_path}`
                : `https://placehold.co/185x278.png?text=${encodeURIComponent(series.name || 'A')}`,
              episodeNumber: nextEpisode.episode_number,
              seasonNumber: nextEpisode.season_number,
              airDate: nextEpisode.air_date, // YYYY-MM-DD string
              episodeName: nextEpisode.name || `Episódio ${nextEpisode.episode_number}`,
              episodeOverview: nextEpisode.overview || '',
              seriesOverview: seriesDetailData.overview || '',
            });
          }
        }
      }

      // 3. Sort episodes by air date
      upcomingEpisodes.sort((a, b) => new Date(a.airDate).getTime() - new Date(b.airDate).getTime());

      return upcomingEpisodes;

    } catch (error: any) {
      console.error("Error in fetchUpcomingAnimeEpisodesFlow:", error);
       if (error.message && (error.message.includes('503') || error.message.toLowerCase().includes('overloaded'))) {
            throw new Error('The TMDB API might be temporarily overloaded. Please try again later.');
      }
      throw new Error(error.message || 'Failed to process upcoming anime episodes.');
    }
  }
);
