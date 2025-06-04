
// src/ai/flows/tmdb-auto-fill.ts
'use server';

/**
 * @fileOverview TMDB Auto-Fill Flow. This flow allows users to search for content in the TMDB database
 * and automatically populate the content metadata fields.
 *
 * - tmdbAutoFill - A function that handles the TMDB auto-fill process.
 * - TmdbAutoFillInput - The input type for the tmdbAutoFill function.
 * - TmdbAutoFillOutput - The return type for the tmdbAutoFill function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TMDB_API_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL_W500 = 'https://image.tmdb.org/t/p/w500';
const TMDB_IMAGE_BASE_URL_W1280 = 'https://image.tmdb.org/t/p/w1280';

const TmdbAutoFillInputSchema = z.object({
  contentName: z.string().describe('The name of the content to search for in TMDB.'),
});
export type TmdbAutoFillInput = z.infer<typeof TmdbAutoFillInputSchema>;

const TmdbAutoFillOutputSchema = z.object({
  title: z.string().describe('The title of the content.'),
  synopsis: z.string().describe('The synopsis of the content.'),
  genres: z.array(z.string()).describe('The genres of the content.'),
  poster: z.string().describe('The URL of the content poster.'),
  banner: z.string().describe('The URL of the content banner.'),
  releaseDate: z.string().describe('The release date of the content.'),
  duration: z.number().optional().nullable().describe('The duration of the content in minutes.'),
  numberOfSeasons: z.number().optional().describe('The number of seasons for series content.'),
});
export type TmdbAutoFillOutput = z.infer<typeof TmdbAutoFillOutputSchema>;

export async function tmdbAutoFill(input: TmdbAutoFillInput): Promise<TmdbAutoFillOutput> {
  return tmdbAutoFillFlow(input);
}

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


const tmdbSearchTool = ai.defineTool(
  {
    name: 'tmdbSearch',
    description: 'Searches for content in the TMDB database and returns the content metadata.',
    inputSchema: z.object({
      contentName: z.string().describe('The name of the content to search for.'),
    }),
    outputSchema: TmdbAutoFillOutputSchema,
  },
  async (input) => {
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) {
      throw new Error('TMDB_API_KEY is not configured in environment variables.');
    }

    // 1. Search for the content
    const searchUrl = `${TMDB_API_BASE_URL}/search/multi?api_key=${apiKey}&query=${encodeURIComponent(input.contentName)}&language=pt-BR&page=1`;
    const searchResponse = await fetch(searchUrl);
    if (!searchResponse.ok) {
      throw new Error(`Failed to search TMDB: ${searchResponse.statusText}`);
    }
    const searchData = await searchResponse.json();

    const firstResult = searchData.results?.find((r: any) => r.media_type === 'movie' || r.media_type === 'tv');

    if (!firstResult) {
      throw new Error(`No movie or TV show found for "${input.contentName}"`);
    }

    const { media_type, id } = firstResult;

    // 2. Fetch detailed information
    const detailsUrl = `${TMDB_API_BASE_URL}/${media_type}/${id}?api_key=${apiKey}&language=pt-BR`;
    const detailsResponse = await fetch(detailsUrl);
    if (!detailsResponse.ok) {
      throw new Error(`Failed to fetch details for ${media_type} ID ${id}: ${detailsResponse.statusText}`);
    }
    const detailsData = await detailsResponse.json();

    // 3. Fetch and map genres
    const currentGenreMap = await fetchGenreMap(apiKey, media_type);
    const genreNames = detailsData.genres?.map((g: Genre) => g.name) ?? 
                       (detailsData.genre_ids?.map((gid: number) => currentGenreMap.get(gid)).filter(Boolean) as string[] ?? []);


    let output: TmdbAutoFillOutput = {
      title: detailsData.title || detailsData.name || 'N/A',
      synopsis: detailsData.overview || '',
      genres: genreNames,
      poster: detailsData.poster_path ? `${TMDB_IMAGE_BASE_URL_W500}${detailsData.poster_path}` : 'https://placehold.co/500x750.png?text=Sem+Poster',
      banner: detailsData.backdrop_path ? `${TMDB_IMAGE_BASE_URL_W1280}${detailsData.backdrop_path}` : 'https://placehold.co/1280x720.png?text=Sem+Banner',
      releaseDate: detailsData.release_date || detailsData.first_air_date || '',
      duration: null, // Default to null
      numberOfSeasons: undefined, // Default to undefined
    };
    
    if (media_type === 'movie') {
      output.duration = detailsData.runtime || null;
    } else if (media_type === 'tv') {
      output.numberOfSeasons = detailsData.number_of_seasons || undefined;
      if (detailsData.episode_run_time && detailsData.episode_run_time.length > 0) {
        output.duration = detailsData.episode_run_time[0];
      } else {
        output.duration = null;
      }
    }
    
    // Ensure all required string fields have a default if somehow null/undefined from API
    output.title = output.title || 'Título Indisponível';
    output.synopsis = output.synopsis || 'Sinopse Indisponível';
    output.poster = output.poster || 'https://placehold.co/500x750.png?text=Sem+Poster';
    output.banner = output.banner || 'https://placehold.co/1280x720.png?text=Sem+Banner';
    output.releaseDate = output.releaseDate || 'Data Indisponível';


    return output;
  }
);

const tmdbAutoFillPrompt = ai.definePrompt({
  name: 'tmdbAutoFillPrompt',
  tools: [tmdbSearchTool],
  input: {schema: TmdbAutoFillInputSchema},
  output: {schema: TmdbAutoFillOutputSchema},
  prompt: `Use the tmdbSearch tool to find information about the content named "{{{contentName}}}". Return all the fields you get back from the tool.`,
});

const tmdbAutoFillFlow = ai.defineFlow(
  {
    name: 'tmdbAutoFillFlow',
    inputSchema: TmdbAutoFillInputSchema,
    outputSchema: TmdbAutoFillOutputSchema,
  },
  async input => {
    const {output} = await tmdbAutoFillPrompt(input);
    if (!output) {
        throw new Error('The TMDB auto-fill tool did not return an output.');
    }
    return output;
  }
);

