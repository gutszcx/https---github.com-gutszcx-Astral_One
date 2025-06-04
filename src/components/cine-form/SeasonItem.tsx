// src/components/cine-form/SeasonItem.tsx
'use client';

import { useFieldArray, type Control, type UseFieldArrayRemove, type UseFormRegister } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2 } from 'lucide-react';
import { EpisodeItem } from './EpisodeItem';
import type { SeriesFormValues } from '@/lib/schemas';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

interface SeasonItemProps {
  control: Control<SeriesFormValues>;
  seasonIndex: number;
  removeSeason: UseFieldArrayRemove;
  register: UseFormRegister<SeriesFormValues>;
}

export function SeasonItem({ control, seasonIndex, removeSeason, register }: SeasonItemProps) {
  const {
    fields: episodeFields,
    append: appendEpisode,
    remove: removeEpisode,
  } = useFieldArray({
    control,
    name: `temporadas.${seasonIndex}.episodios`,
  });

  return (
    <div className="p-6 border rounded-lg space-y-6 bg-card shadow-md">
      <div className="flex justify-between items-center">
        <FormField
          control={control}
          name={`temporadas.${seasonIndex}.numeroTemporada`}
          render={({ field }) => (
            <FormItem className="flex-grow mr-4">
              <FormLabel className="text-lg font-semibold">Temporada Número</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  className="text-lg font-semibold w-24"
                  {...field} 
                  onChange={e => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="button"
          variant="destructive"
          onClick={() => removeSeason(seasonIndex)}
          aria-label="Remover temporada"
        >
          <Trash2 className="mr-2 h-4 w-4" /> Remover Temporada
        </Button>
      </div>

      <div className="space-y-4">
        {episodeFields.map((episode, episodeIdx) => (
          <EpisodeItem
            key={episode.id}
            control={control}
            seasonIndex={seasonIndex}
            episodeIndex={episodeIdx}
            removeEpisode={removeEpisode}
            register={register}
          />
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        onClick={() => appendEpisode({ titulo: '', descricao: '', duracao: null, linkVideo: '', linkLegenda: '' })}
        className="w-full"
      >
        <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Episódio
      </Button>
       {/* Opção para preencher episódios via busca no TMDB - Placeholder */}
       {/* <Button type="button" variant="outline" className="w-full mt-2">
            <Search className="mr-2 h-4 w-4" /> Preencher Episódios via TMDB (Temporada)
       </Button> */}
    </div>
  );
}
