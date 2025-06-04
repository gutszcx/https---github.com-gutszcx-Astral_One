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
  profileImageUrl: z.string().url().describe('The URL of the cast member\'s profile image.'),
  knownForDepartment: z.string().optional().describe('The department the cast member is known for.'),
});
export type CastMember = z.infer<typeof CastMemberSchema>;

const TmdbCastSearchOutputSchema = z.array(CastMemberSchema);
export type TmdbCastSearchOutput = z.infer<typeof TmdbCastSearchOutputSchema>;

export async function tmdbCastSearch(input: TmdbCastSearchInput): Promise<TmdbCastSearchOutput> {
  return tmdbCastSearchFlow(input);
}

const tmdbPersonSearchTool = ai.defineTool(
  {
    name: 'tmdbPersonSearch',
    description: 'Searches for people (cast members) in the TMDB database and returns their details.',
    inputSchema: TmdbCastSearchInputSchema,
    outputSchema: TmdbCastSearchOutputSchema,
  },
  async (input) => {
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
);

const tmdbCastSearchPrompt = ai.definePrompt({
  name: 'tmdbCastSearchPrompt',
  tools: [tmdbPersonSearchTool],
  input: {schema: TmdbCastSearchInputSchema},
  output: {schema: TmdbCastSearchOutputSchema},
  prompt: `Use the tmdbPersonSearch tool to find cast members named "{{{castName}}}". Your response MUST be an array of cast members, conforming to the provided schema. If the tool returns an empty list of results (an empty array), you MUST return an empty array ([]). Do not return null or any other value if the tool finds no results but executes successfully.`,
});

const tmdbCastSearchFlow = ai.defineFlow(
  {
    name: 'tmdbCastSearchFlow',
    inputSchema: TmdbCastSearchInputSchema,
    outputSchema: TmdbCastSearchOutputSchema,
  },
  async (input) => {
    const {output} = await tmdbCastSearchPrompt(input);
    // If 'output' is null/undefined here, it means the prompt's result (after LLM generation and Zod parsing)
    // did not conform to the TmdbCastSearchOutputSchema (an array).
    // The error "Provided data: null" for an array schema means the LLM likely produced 'null'.
    // In such a case, to ensure the flow adheres to its own outputSchema, we default to an empty array.
    if (!output || !Array.isArray(output)) {
        // This explicitly handles the case where the LLM response, despite schema hints, was not a valid array.
        return [];
    }
    return output;
  }
);
