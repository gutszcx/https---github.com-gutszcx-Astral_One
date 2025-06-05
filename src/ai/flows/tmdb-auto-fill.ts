
// src/ai/flows/tmdb-auto-fill.ts
'use server';

/**
 * @fileOverview TMDB Search and Detail Fetching Flows.
 * - searchTmdbContent: Searches TMDB for content and returns a list of results.
 * - fetchTmdbContentDetails: Fetches detailed information for a specific TMDB content ID.
 * - TmdbSearchInput - Input for searching content.
 * - TmdbMultiSearchOutput - Output for search results.
 * - TmdbFetchDetailsInput - Input for fetching detailed content.
 * - TmdbDetailedContentOutput - Output for detailed content.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TMDB_API_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL_W185 = 'https://image.tmdb.org/t/p/w185';
const TMDB_IMAGE_BASE_URL_W500 = 'https://image.tmdb.org/t/p/w500';
const TMDB_IMAGE_BASE_URL_W1280 = 'https://image.tmdb.org/t/p/w1280';

// Schemas for Multi-Search (listing results)
const TmdbSearchInputSchema = z.object({
  contentName: z.string().describe('The name of the content to search for in TMDB.'),
});
export type TmdbSearchInput = z.infer<typeof TmdbSearchInputSchema>;

const TmdbSearchResultItemSchema = z.object({
  id: z.number().describe('The TMDB ID of the content.'),
  title: z.string().describe('The title of the content.'),
  mediaType: z.enum(['movie', 'tv']).describe('The type of content (movie or tv).'),
  posterUrl: z.string().url().or(z.string().refine((val) => val.startsWith('https://placehold.co'), { message: "URL must start with https://placehold.co" })).describe('The URL of the content poster.'),
  releaseYear: z.string().nullable().describe('The release year of the content.'),
  overview: z.string().nullable().describe('A brief overview of the content.'),
});
export type TmdbSearchResultItem = z.infer<typeof TmdbSearchResultItemSchema>;

const TmdbMultiSearchOutputSchema = z.array(TmdbSearchResultItemSchema);
export type TmdbMultiSearchOutput = z.infer<typeof TmdbMultiSearchOutputSchema>;


// Schemas for Fetching Detailed Content
const TmdbFetchDetailsInputSchema = z.object({
  id: z.number().describe('The TMDB ID of the content.'),
  mediaType: z.enum(['movie', 'tv']).describe('The type of content (movie or tv).'),
});
export type TmdbFetchDetailsInput = z.infer<typeof TmdbFetchDetailsInputSchema>;

const TmdbDetailedContentOutputSchema = z.object({
  title: z.string().describe('The title of the content.'),
  synopsis: z.string().describe('The synopsis of the content.'),
  genres: z.array(z.string()).describe('The genres of the content.'),
  poster: z.string().url().or(z.string().refine((val) => val.startsWith('https://placehold.co'), { message: "URL must start with https://placehold.co" })).describe('The URL of the content poster (w500).'),
  banner: z.string().url().or(z.string().refine((val) => val.startsWith('https://placehold.co'), { message: "URL must start with https://placehold.co" })).describe('The URL of the content banner (w1280).'),
  releaseDate: z.string().describe('The release date of the content.'),
  duration: z.number().optional().nullable().describe('The duration of the content in minutes.'),
  numberOfSeasons: z.number().optional().describe('The number of seasons for series content.'),
});
export type TmdbDetailedContentOutput = z.infer<typeof TmdbDetailedContentOutputSchema>;


// Helper for genre mapping
interface Genre {
  id: number;
  name: string;
}
let movieGenreMap: Map<number, string> | null = null;
let tvGenreMap: Map<number, string> | null = null;

async function fetchGenreMap(apiKey: string, type: 'movie' | 'tv'): Promise<Map<number, string>> {
  if (type === 'movie' && movieGenreMap) return movieGenreMap;
  if (type === 'tv' && tvGenreMap) return tvGenreMap;

  const url = `${TMDB_API_BASE_URL}/genre/${type}/list?api_key=${apiKey}&language=pt-BR`;
  const response = await fetch(url);
  if (!response.ok) {
    console.error(`Failed to fetch ${type} genres: ${response.statusText}`);
    return new Map();
  }
  const data = await response.json();
  const map = new Map(data.genres.map((genre: Genre) => [genre.id, genre.name]));
  if (type === 'movie') movieGenreMap = map;
  else tvGenreMap = map;
  return map;
}

// Internal function for TMDB Multi-Search logic
async function _fetchTmdbMultiSearchInternal(input: TmdbSearchInput): Promise<TmdbMultiSearchOutput> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    throw new Error('TMDB_API_KEY is not configured in environment variables.');
  }

  const searchUrl = `${TMDB_API_BASE_URL}/search/multi?api_key=${apiKey}&query=${encodeURIComponent(input.contentName)}&language=pt-BR&page=1&include_adult=false`;
  const searchResponse = await fetch(searchUrl);
  if (!searchResponse.ok) {
    throw new Error(`Failed to search TMDB: ${searchResponse.statusText}`);
  }
  const searchData = await searchResponse.json();

  if (!searchData.results) {
    return [];
  }
  
  const results: TmdbMultiSearchOutput = searchData.results
    .filter((r: any) => r.media_type === 'movie' || r.media_type === 'tv')
    .map((r: any) => {
      const title = r.title || r.name || 'Título Desconhecido';
      const releaseDate = r.release_date || r.first_air_date;
      return {
        id: r.id,
        title: title,
        mediaType: r.media_type,
        posterUrl: r.poster_path 
          ? `${TMDB_IMAGE_BASE_URL_W185}${r.poster_path}` 
          : `https://placehold.co/185x278.png`,
        releaseYear: releaseDate ? releaseDate.substring(0, 4) : null,
        overview: r.overview ? (r.overview.length > 150 ? r.overview.substring(0, 147) + '...' : r.overview) : null,
      };
    });
  return results;
}

// Tool definition (still useful if other AI prompts want to use it)
const tmdbMultiSearchTool = ai.defineTool(
  {
    name: 'tmdbMultiSearch',
    description: 'Searches TMDB for movies and TV shows based on a query and returns a list of results.',
    inputSchema: TmdbSearchInputSchema,
    outputSchema: TmdbMultiSearchOutputSchema,
  },
  _fetchTmdbMultiSearchInternal // Use the extracted internal function
);

// Flow 1: Search for content (multi-search) - directly calls the internal logic
export async function searchTmdbContent(input: TmdbSearchInput): Promise<TmdbMultiSearchOutput> {
  return tmdbMultiSearchFlow(input);
}

const tmdbMultiSearchFlow = ai.defineFlow(
  {
    name: 'tmdbMultiSearchFlow',
    inputSchema: TmdbSearchInputSchema,
    outputSchema: TmdbMultiSearchOutputSchema,
  },
  async (input: TmdbSearchInput): Promise<TmdbMultiSearchOutput> => {
    try {
      return await _fetchTmdbMultiSearchInternal(input);
    } catch (error: any) {
      console.error("Error in tmdbMultiSearchFlow (direct call):", error);
      // Propagate specific error messages if needed, or a generic one
      if (error.message && (error.message.includes('503') || error.message.toLowerCase().includes('overloaded'))) {
        throw new Error('The AI model (Gemini) is temporarily overloaded. Please try again later.');
      }
      throw new Error(error.message || 'Failed to process TMDB multi-search.');
    }
  }
);


// Internal function for TMDB Fetch Details logic
async function _fetchTmdbContentDetailsInternal(input: TmdbFetchDetailsInput): Promise<TmdbDetailedContentOutput> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    throw new Error('TMDB_API_KEY is not configured in environment variables.');
  }

  const { id, mediaType } = input;
  const detailsUrl = `${TMDB_API_BASE_URL}/${mediaType}/${id}?api_key=${apiKey}&language=pt-BR`;
  const detailsResponse = await fetch(detailsUrl);
  if (!detailsResponse.ok) {
    throw new Error(`Failed to fetch details for ${mediaType} ID ${id}: ${detailsResponse.statusText}`);
  }
  const detailsData = await detailsResponse.json();

  const currentGenreMap = await fetchGenreMap(apiKey, mediaType);
  const genreNames = detailsData.genres?.map((g: Genre) => g.name) ?? 
                     (detailsData.genre_ids?.map((gid: number) => currentGenreMap.get(gid)).filter(Boolean) as string[] ?? []);

  let output: TmdbDetailedContentOutput = {
    title: detailsData.title || detailsData.name || 'N/A',
    synopsis: detailsData.overview || '',
    genres: genreNames,
    poster: detailsData.poster_path ? `${TMDB_IMAGE_BASE_URL_W500}${detailsData.poster_path}` : `https://placehold.co/500x750.png`,
    banner: detailsData.backdrop_path ? `${TMDB_IMAGE_BASE_URL_W1280}${detailsData.backdrop_path}` : `https://placehold.co/1280x720.png`,
    releaseDate: detailsData.release_date || detailsData.first_air_date || '',
    duration: null,
    numberOfSeasons: undefined,
  };
  
  if (mediaType === 'movie') {
    output.duration = detailsData.runtime || null;
  } else if (mediaType === 'tv') {
    output.numberOfSeasons = detailsData.number_of_seasons || undefined;
    if (detailsData.episode_run_time && detailsData.episode_run_time.length > 0) {
      output.duration = detailsData.episode_run_time[0];
    } else {
      output.duration = null;
    }
  }
  
  output.title = output.title || 'Título Indisponível';
  output.synopsis = output.synopsis || 'Sinopse Indisponível';
  output.releaseDate = output.releaseDate || 'Data Indisponível';

  return output;
}

// Tool definition
const tmdbFetchDetailsTool = ai.defineTool(
  {
    name: 'tmdbFetchDetails',
    description: 'Fetches detailed information for a specific movie or TV show from TMDB using its ID and media type.',
    inputSchema: TmdbFetchDetailsInputSchema,
    outputSchema: TmdbDetailedContentOutputSchema,
  },
  _fetchTmdbContentDetailsInternal // Use the extracted internal function
);

// Flow 2: Fetch detailed information for a specific content ID - directly calls internal logic
export async function fetchTmdbContentDetails(input: TmdbFetchDetailsInput): Promise<TmdbDetailedContentOutput> {
  return tmdbFetchDetailsFlow(input);
}

const tmdbFetchDetailsFlow = ai.defineFlow(
  {
    name: 'tmdbFetchDetailsFlow',
    inputSchema: TmdbFetchDetailsInputSchema,
    outputSchema: TmdbDetailedContentOutputSchema,
  },
  async (input: TmdbFetchDetailsInput): Promise<TmdbDetailedContentOutput> => {
    try {
      return await _fetchTmdbContentDetailsInternal(input);
    } catch (error: any) {
        console.error("Error in tmdbFetchDetailsFlow (direct call):", error);
        if (error.message && (error.message.includes('503') || error.message.toLowerCase().includes('overloaded'))) {
            throw new Error('The AI model (Gemini) is temporarily overloaded. Please try again later.');
        }
        throw new Error(error.message || 'Failed to process TMDB detail fetch.');
    }
  }
);
