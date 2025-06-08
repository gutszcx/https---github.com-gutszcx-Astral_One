
import { config } from 'dotenv';
config();

import '@/ai/flows/tmdb-auto-fill.ts';
import '@/ai/flows/tmdb-cast-search-flow.ts';
import '@/ai/flows/fetch-upcoming-anime-episodes-flow.ts'; // Added new flow
