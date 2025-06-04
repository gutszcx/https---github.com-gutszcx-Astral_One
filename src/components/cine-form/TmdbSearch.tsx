// src/components/cine-form/TmdbSearch.tsx
'use client';

import type { UseFormReturn } from 'react-hook-form';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, Loader2 } from 'lucide-react';
import { tmdbAutoFill, TmdbAutoFillOutput } from '@/ai/flows/tmdb-auto-fill';
import type { CineFormValues, MovieFormValues, SeriesFormValues } from '@/lib/schemas';
import { useToast } from '@/hooks/use-toast';

interface TmdbSearchProps {
  form: UseFormReturn<CineFormValues>;
  contentType: 'movie' | 'series';
}

export function TmdbSearch({ form, contentType }: TmdbSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({ title: "Erro na Busca", description: "Por favor, insira um nome para buscar.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const result = await tmdbAutoFill({ contentName: searchQuery });
      updateFormFields(result);
      toast({ title: "Busca Concluída", description: `Dados de "${result.title}" preenchidos.` });
    } catch (error) {
      console.error('TMDB Auto-fill error:', error);
      toast({ title: "Erro na Busca", description: "Não foi possível buscar os dados do TMDB.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormFields = (data: TmdbAutoFillOutput) => {
    form.setValue('tituloOriginal', data.title, { shouldValidate: true });
    form.setValue('sinopse', data.synopsis, { shouldValidate: true });
    form.setValue('generos', data.genres.join(', '), { shouldValidate: true });
    form.setValue('capaPoster', data.poster, { shouldValidate: true });
    form.setValue('bannerFundo', data.banner, { shouldValidate: true });
    
    const releaseYear = data.releaseDate ? parseInt(data.releaseDate.substring(0, 4), 10) : undefined;
    if (releaseYear && !isNaN(releaseYear)) {
       form.setValue('anoLancamento', releaseYear, { shouldValidate: true });
    } else {
       form.setValue('anoLancamento', null);
    }

    if (data.duration) {
      form.setValue('duracaoMedia', data.duration, { shouldValidate: true });
    } else {
      form.setValue('duracaoMedia', null);
    }

    if (contentType === 'series' && data.numberOfSeasons) {
      // Type assertion needed due to discriminated union
      (form.setValue as UseFormReturn<SeriesFormValues>['setValue'])('totalTemporadas', data.numberOfSeasons, { shouldValidate: true });
      // Optionally, you could pre-fill season structures if the AI provided more detail
      const currentSeasons = (form.getValues() as SeriesFormValues).temporadas || [];
      const newSeasons = Array.from({ length: data.numberOfSeasons }, (_, i) => {
        const existingSeason = currentSeasons.find(s => s.numeroTemporada === i + 1);
        return existingSeason || { numeroTemporada: i + 1, episodios: [] };
      });
      (form.setValue as UseFormReturn<SeriesFormValues>['setValue'])('temporadas', newSeasons, { shouldValidate: true });

    } else if (contentType === 'movie' && data.numberOfSeasons !== undefined) {
      // If TMDB returns numberOfSeasons for a movie search, it might indicate a mistake.
      // Or, the user might have searched for a series name while "Movie" type is selected.
      // For now, we just ignore numberOfSeasons for movies.
    }
  };

  return (
    <div className="space-y-2 p-4 border rounded-lg shadow-sm bg-card">
      <Label htmlFor="tmdbSearch" className="text-base font-semibold">Busca Automática (TMDB)</Label>
      <p className="text-sm text-muted-foreground">
        Digite o nome do conteúdo para preencher os campos automaticamente.
      </p>
      <div className="flex items-center space-x-2">
        <Input
          id="tmdbSearch"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Ex: Interestelar, Stranger Things..."
          className="flex-grow"
          disabled={isLoading}
        />
        <Button onClick={handleSearch} disabled={isLoading} type="button">
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Search className="mr-2 h-4 w-4" />
          )}
          Buscar
        </Button>
      </div>
    </div>
  );
}
