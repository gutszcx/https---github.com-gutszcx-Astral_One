// src/components/cine-form/TmdbCastSearch.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, Loader2, Users } from 'lucide-react';
import { tmdbCastSearch, type CastMember } from '@/ai/flows/tmdb-cast-search-flow';
import { useToast } from '@/hooks/use-toast';
import { CastMemberCard } from './CastMemberCard';
import { Separator } from '@/components/ui/separator';

export function TmdbCastSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<CastMember[]>([]);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({ title: "Erro na Busca", description: "Por favor, insira um nome para buscar.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    setResults([]); // Clear previous results
    try {
      const castMembers = await tmdbCastSearch({ castName: searchQuery });
      setResults(castMembers);
      if (castMembers.length === 0) {
        toast({ title: "Nenhum Resultado", description: `Nenhum membro do elenco encontrado para "${searchQuery}".` });
      } else {
        toast({ title: "Busca de Elenco Concluída", description: `${castMembers.length} resultado(s) encontrado(s).` });
      }
    } catch (error) {
      console.error('TMDB Cast Search error:', error);
      toast({ title: "Erro na Busca de Elenco", description: "Não foi possível buscar os dados do TMDB.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-4 border rounded-lg shadow-sm bg-card">
      <div>
        <Label htmlFor="tmdbCastSearch" className="text-base font-semibold flex items-center mb-1">
          <Users className="mr-2 h-5 w-5 text-primary" />
          Buscar Elenco no TMDB
        </Label>
        <p className="text-sm text-muted-foreground mb-3">
          Digite o nome de um ator, atriz ou membro da equipe para buscar.
        </p>
        <div className="flex items-center space-x-2">
          <Input
            id="tmdbCastSearch"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Ex: Tom Hanks, Zendaya..."
            className="flex-grow"
            disabled={isLoading}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
          />
          <Button onClick={handleSearch} disabled={isLoading} type="button">
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Search className="mr-2 h-4 w-4" />
            )}
            Buscar Elenco
          </Button>
        </div>
      </div>

      {results.length > 0 && (
        <>
          <Separator />
          <div>
            <h3 className="text-lg font-semibold mb-4">Resultados da Busca:</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {results.map((member) => (
                <CastMemberCard key={member.id} member={member} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
