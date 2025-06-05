
// src/ai/flows/tmdb-cast-search-flow.ts
'use server';

/**
 * @fileOverview TMDB Cast Search Flow. This flow allows users to search for cast members in the TMDB database.
 *
 * - tmdbCastSearch - A function that handles the TMDB cast search process.
 * - TmdbCastSearchInput - The input type for the tmdbCastSearch function.
 * - TmdbCastSearchOutput - The return type for the tmdbCastSearch function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TMDB_API_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_PROFILE_IMAGE_BASE_URL_W185 = 'https://image.tmdb.org/t/p/w185';

const TmdbCastSearchInputSchema = z.object({
  castName: z.string().describe('The name of the cast member to search for in TMDB.'),
});
export type TmdbCastSearchInput = z.infer<typeof TmdbCastSearchInputSchema>;

const CastMemberSchema = z.object({
  id: z.number().describe('The TMDB ID of the cast member.'),
  name: z.string().describe('The name of the cast member.'),
  profileImageUrl: z.string().url().or(z.string().refine((val) => val.startsWith('https://placehold.co'), { message: "URL must start with https://placehold.co" })).describe('The URL of the cast member\'s profile image.'),
  knownForDepartment: z.string().optional().describe('The department the cast member is known for.'),
});
export type CastMember = z.infer<typeof CastMemberSchema>;

const TmdbCastSearchOutputSchema = z.array(CastMemberSchema);
export type TmdbCastSearchOutput = z.infer<typeof TmdbCastSearchOutputSchema>;


// Internal function for TMDB Cast Search logic
async function _fetchTmdbCastSearchInternal(input: TmdbCastSearchInput): Promise<TmdbCastSearchOutput> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    throw new Error('TMDB_API_KEY is not configured in environment variables.');
  }

  const searchUrl = `${TMDB_API_BASE_URL}/search/person?api_key=${apiKey}&query=${encodeURIComponent(input.castName)}&language=pt-BR&page=1`;
  const searchResponse = await fetch(searchUrl);
  if (!searchResponse.ok) {
    throw new Error(`Failed to search TMDB for person: ${searchResponse.statusText}`);
  }
  const searchData = await searchResponse.json();

  if (!searchData.results || searchData.results.length === 0) {
    return [];
  }

  const castMembers: TmdbCastSearchOutput = searchData.results.map((person: any) => ({
    id: person.id,
    name: person.name,
    profileImageUrl: person.profile_path 
      ? `${TMDB_PROFILE_IMAGE_BASE_URL_W185}${person.profile_path}` 
      : `https://placehold.co/185x278.png?text=${encodeURIComponent(person.name.split(' ').join('+'))}`, // Placeholder if no image
    knownForDepartment: person.known_for_department,
  }));
  
  return castMembers;
}

// Tool definition
const tmdbPersonSearchTool = ai.defineTool(
  {
    name: 'tmdbPersonSearch',
    description: 'Searches for people (cast members) in the TMDB database and returns their details.',
    inputSchema: TmdbCastSearchInputSchema,
    outputSchema: TmdbCastSearchOutputSchema,
  },
  _fetchTmdbCastSearchInternal // Use the extracted internal function
);

// Exported function that calls the flow
export async function tmdbCastSearch(input: TmdbCastSearchInput): Promise<TmdbCastSearchOutput> {
  return tmdbCastSearchFlow(input);
}

// Flow definition - directly calls internal logic
const tmdbCastSearchFlow = ai.defineFlow(
  {
    name: 'tmdbCastSearchFlow',
    inputSchema: TmdbCastSearchInputSchema,
    outputSchema: TmdbCastSearchOutputSchema,
  },
  async (input: TmdbCastSearchInput): Promise<TmdbCastSearchOutput> => {
    try {
      return await _fetchTmdbCastSearchInternal(input);
    } catch (error: any) {
      console.error("Error in tmdbCastSearchFlow (direct call):", error);
       if (error.message && (error.message.includes('503') || error.message.toLowerCase().includes('overloaded'))) {
            throw new Error('The AI model (Gemini) is temporarily overloaded. Please try again later.');
        }
      throw new Error(error.message || 'Failed to process TMDB cast search.');
    }
  }
);
