import { z } from 'zod';

export const CLASSIFICACAO_INDICATIVA_OPTIONS = ['Livre', '10+', '12+', '14+', '16+', '18+'] as const;
export const QUALIDADE_OPTIONS = ['4K', '1080p', '720p', 'SD'] as const;
export const IDIOMA_OPTIONS = [
  'Português (Brasil)', 
  'Inglês', 
  'Espanhol', 
  'Japonês', 
  'Coreano', 
  'Francês', 
  'Alemão',
  'Outro'
] as const;
export const GENERO_OPTIONS = [ // Example, can be fetched or expanded
  'Ação', 'Aventura', 'Comédia', 'Drama', 'Fantasia', 'Ficção Científica', 
  'Suspense', 'Terror', 'Romance', 'Documentário', 'Animação'
] as const;


export const episodeSchema = z.object({
  id: z.string().optional(), // for useFieldArray key
  titulo: z.string().min(1, "Título do episódio é obrigatório."),
  descricao: z.string().optional(),
  duracao: z.coerce.number().positive("Duração deve ser um número positivo.").optional().nullable(),
  linkVideo: z.string().url({ message: "Link do vídeo inválido." }).optional().or(z.literal('')),
  linkLegenda: z.string().url({ message: "Link da legenda inválido." }).optional().or(z.literal('')),
});
export type EpisodeFormValues = z.infer<typeof episodeSchema>;

export const seasonSchema = z.object({
  id: z.string().optional(), // for useFieldArray key
  numeroTemporada: z.coerce.number().int().min(1, "Número da temporada deve ser pelo menos 1."),
  episodios: z.array(episodeSchema).optional().default([]),
});
export type SeasonFormValues = z.infer<typeof seasonSchema>;

export const baseContentSchema = z.object({
  tmdbSearchQuery: z.string().optional(),
  tituloOriginal: z.string().min(1, "Título Original é obrigatório."),
  tituloLocalizado: z.string().optional(),
  sinopse: z.string().min(1, "Sinopse é obrigatória.").max(2000, "Sinopse muito longa.").optional().or(z.literal('')),
  generos: z.string().optional(), // Comma-separated or handle as array if using multi-select component
  idiomaOriginal: z.string().optional(), // Use text input for flexibility or z.enum(IDIOMA_OPTIONS) if strict list
  dublagensDisponiveis: z.string().optional(), // Comma-separated
  anoLancamento: z.coerce.number().int().min(1800, "Ano inválido.").max(new Date().getFullYear() + 10, "Ano futuro inválido.").optional().nullable(),
  duracaoMedia: z.coerce.number().positive("Duração deve ser um número positivo.").optional().nullable(),
  classificacaoIndicativa: z.string().optional(), // z.enum(CLASSIFICACAO_INDICATIVA_OPTIONS)
  qualidade: z.string().optional(), // z.enum(QUALIDADE_OPTIONS)
  capaPoster: z.string().url({ message: "URL da capa/poster inválida." }).optional().or(z.literal('')),
  bannerFundo: z.string().url({ message: "URL do banner de fundo inválida." }).optional().or(z.literal('')),
  tags: z.string().optional(),
  destaqueHome: z.boolean().optional().default(false),
  status: z.enum(['ativo', 'inativo']).default('ativo'),
});

export const movieSchema = baseContentSchema.extend({
  contentType: z.literal('movie'),
  linkVideo: z.string().url({ message: "Link do vídeo inválido." }).optional().or(z.literal('')),
  linkLegendas: z.string().url({ message: "Link da legenda inválido." }).optional().or(z.literal('')),
});
export type MovieFormValues = z.infer<typeof movieSchema>;

export const seriesSchema = baseContentSchema.extend({
  contentType: z.literal('series'),
  totalTemporadas: z.coerce.number().int().min(0, "Total de temporadas não pode ser negativo.").optional().nullable(), // 0 if unknown initially
  temporadas: z.array(seasonSchema).optional().default([]),
});
export type SeriesFormValues = z.infer<typeof seriesSchema>;

export const cineFormSchema = z.discriminatedUnion("contentType", [
  movieSchema,
  seriesSchema,
]);
export type CineFormValues = z.infer<typeof cineFormSchema>;

export const defaultMovieValues: MovieFormValues = {
  contentType: 'movie',
  tmdbSearchQuery: '',
  tituloOriginal: '',
  tituloLocalizado: '',
  sinopse: '',
  generos: '',
  idiomaOriginal: '',
  dublagensDisponiveis: '',
  anoLancamento: null,
  duracaoMedia: null,
  classificacaoIndicativa: CLASSIFICACAO_INDICATIVA_OPTIONS[0],
  qualidade: QUALIDADE_OPTIONS[0],
  capaPoster: '',
  bannerFundo: '',
  tags: '',
  destaqueHome: false,
  status: 'ativo',
  linkVideo: '',
  linkLegendas: '',
};

export const defaultSeriesValues: SeriesFormValues = {
  contentType: 'series',
  tmdbSearchQuery: '',
  tituloOriginal: '',
  tituloLocalizado: '',
  sinopse: '',
  generos: '',
  idiomaOriginal: '',
  dublagensDisponiveis: '',
  anoLancamento: null,
  duracaoMedia: null,
  classificacaoIndicativa: CLASSIFICACAO_INDICATIVA_OPTIONS[0],
  qualidade: QUALIDADE_OPTIONS[0],
  capaPoster: '',
  bannerFundo: '',
  tags: '',
  destaqueHome: false,
  status: 'ativo',
  totalTemporadas: 1,
  temporadas: [{ numeroTemporada: 1, episodios: [] }],
};
