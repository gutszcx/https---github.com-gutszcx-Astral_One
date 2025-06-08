
// src/components/cine-form/TmdbSearch.tsx
'use client';

import type { UseFormReturn } from 'react-hook-form';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, Loader2, ListChecks } from 'lucide-react';
import { 
  searchTmdbContent, 
  fetchTmdbContentDetails, 
  type TmdbDetailedContentOutput,
  type TmdbSearchResultItem
} from '@/ai/flows/tmdb-auto-fill';
import type { CineFormValues, SeriesFormValues } from '@/lib/schemas';
import { useToast } from '@/hooks/use-toast';
import { TmdbSearchResultCard } from './TmdbSearchResultCard';
import { Separator } from '@/components/ui/separator';

interface TmdbSearchProps {
  form: UseFormReturn<CineFormValues>;
  contentType: 'movie' | 'series';
}

export function TmdbSearch({ form, contentType }: TmdbSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
  const [searchResults, setSearchResults] = useState<TmdbSearchResultItem[]>([]);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({ title: "Erro na Busca", description: "Por favor, insira um nome para buscar.", variant: "destructive" });
      return;
    }
    setIsLoadingSearch(true);
    setSearchResults([]);
    try {
      const results = await searchTmdbContent({ contentName: searchQuery });
      setSearchResults(results);
      if (results.length === 0) {
        toast({ title: "Nenhum Resultado", description: `Nenhuma correspondência encontrada para "${searchQuery}".` });
      } else {
         toast({ title: "Busca Concluída", description: `${results.length} resultado(s) encontrado(s).` });
      }
    } catch (error) {
      console.error('TMDB Search error:', error);
      toast({ title: "Erro na Busca", description: "Não foi possível buscar os dados do TMDB.", variant: "destructive" });
    } finally {
      setIsLoadingSearch(false);
    }
  };

  const handleSelectResult = async (id: number, mediaType: 'movie' | 'tv') => {
    setIsFetchingDetails(true);
    try {
      const detailedData = await fetchTmdbContentDetails({ id, mediaType });
      updateFormFields(detailedData); // detailedData includes tmdbId from the flow
      toast({ title: "Dados Preenchidos", description: `Dados de "${detailedData.title}" foram carregados no formulário.` });
      setSearchResults([]); // Clear results after selection
    } catch (error) {
      console.error('TMDB Fetch Details error:', error);
      toast({ title: "Erro ao Carregar Detalhes", description: "Não foi possível carregar os detalhes do item selecionado.", variant: "destructive" });
    } finally {
      setIsFetchingDetails(false);
    }
  };

  const updateFormFields = (data: TmdbDetailedContentOutput) => {
    form.setValue('tmdbId', data.tmdbId, { shouldValidate: true }); // Set tmdbId
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

    const tmdbMediaType = data.numberOfSeasons !== undefined ? 'series' : 'movie';

    if (form.getValues('contentType') === 'series' && tmdbMediaType === 'series' && data.numberOfSeasons) {
      (form.setValue as UseFormReturn<SeriesFormValues>['setValue'])('totalTemporadas', data.numberOfSeasons, { shouldValidate: true });
      const currentSeasons = (form.getValues() as SeriesFormValues).temporadas || [];
      const newSeasons = Array.from({ length: data.numberOfSeasons }, (_, i) => {
        const existingSeason = currentSeasons.find(s => s.numeroTemporada === i + 1);
        return existingSeason || { numeroTemporada: i + 1, episodios: [] };
      });
      (form.setValue as UseFormReturn<SeriesFormValues>['setValue'])('temporadas', newSeasons, { shouldValidate: true });
    } else if (form.getValues('contentType') === 'movie' && tmdbMediaType === 'movie') {
      // Movie specific fields, if any, beyond duration handled above
    } else if (form.getValues('contentType') !== tmdbMediaType) {
        toast({
            title: "Tipo de Conteúdo Divergente",
            description: `O item selecionado é um(a) ${tmdbMediaType === 'movie' ? 'filme' : 'série'}, mas o formulário está configurado para ${form.getValues('contentType') === 'movie' ? 'filme' : 'série'}. Alguns campos podem não ser preenchidos corretamente. Considere mudar o tipo de conteúdo no formulário.`,
            variant: "default",
            duration: 7000,
        })
         if (tmdbMediaType === 'series' && data.numberOfSeasons) {
            (form.setValue as UseFormReturn<CineFormValues>['setValue'])('duracaoMedia', data.duration || null, { shouldValidate: true });
         }
    }
  };

  const isLoading = isLoadingSearch || isFetchingDetails;

  return (
    <div className="space-y-4 p-4 border rounded-lg shadow-sm bg-card">
      <div>
        <Label htmlFor="tmdbSearch" className="text-base font-semibold">Busca Automática (TMDB)</Label>
        <p className="text-sm text-muted-foreground">
          Digite o nome do conteúdo para buscar e preencher os campos automaticamente.
        </p>
        <div className="flex items-center space-x-2 mt-2">
          <Input
            id="tmdbSearch"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Ex: Interestelar, Stranger Things..."
            className="flex-grow"
            disabled={isLoading}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
          />
          <Button onClick={handleSearch} disabled={isLoading} type="button">
            {isLoadingSearch ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Search className="mr-2 h-4 w-4" />
            )}
            Buscar
          </Button>
        </div>
      </div>

      {isFetchingDetails && (
        <div className="flex items-center justify-center p-4">
          <Loader2 className="mr-2 h-6 w-6 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando detalhes...</p>
        </div>
      )}

      {searchResults.length > 0 && !isFetchingDetails && (
        <>
          <Separator />
          <div>
            <h3 className="text-lg font-semibold mb-3">Resultados da Busca ({searchResults.length}):</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[500px] overflow-y-auto pr-2">
              {searchResults.map((item) => (
                <TmdbSearchResultCard 
                  key={item.id} 
                  item={item} 
                  onSelect={() => handleSelectResult(item.id, item.mediaType)}
                  isSelecting={isLoading}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

