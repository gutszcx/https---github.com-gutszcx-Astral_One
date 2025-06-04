// src/components/cine-form/SeriesFields.tsx
'use client';

import { useFieldArray, type Control, type UseFormRegister } from 'react-hook-form';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PlusCircle, Tv } from 'lucide-react';
import { SeasonItem } from './SeasonItem';
import type { SeriesFormValues } from '@/lib/schemas';
import { Separator } from '@/components/ui/separator';

interface SeriesFieldsProps {
  control: Control<SeriesFormValues>;
  register: UseFormRegister<SeriesFormValues>;
}

export function SeriesFields({ control, register }: SeriesFieldsProps) {
  const {
    fields: seasonFields,
    append: appendSeason,
    remove: removeSeason,
  } = useFieldArray({
    control,
    name: 'temporadas',
  });

  return (
    <div className="space-y-8">
      <FormField
        control={control}
        name="totalTemporadas"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Total de Temporadas</FormLabel>
            <FormControl>
              <Input 
                type="number" 
                placeholder="Ex: 5" 
                {...field} 
                value={field.value ?? ''}
                onChange={e => {
                  const val = e.target.value === '' ? null : Number(e.target.value);
                  field.onChange(val);
                  // Optionally adjust season items
                  if (val !== null && val >= 0) {
                    const currentSeasonCount = seasonFields.length;
                    if (val > currentSeasonCount) {
                      for (let i = currentSeasonCount; i < val; i++) {
                        appendSeason({ numeroTemporada: i + 1, episodios: [] });
                      }
                    } else if (val < currentSeasonCount) {
                      for (let i = currentSeasonCount - 1; i >= val; i--) {
                        removeSeason(i);
                      }
                    }
                  }
                }}
              />
            </FormControl>
            <FormDescription>Informe o número total de temporadas da série.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <Separator />

      <div>
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold flex items-center">
                <Tv className="mr-2 h-6 w-6 text-primary" />
                Temporadas e Episódios
            </h3>
            <Button
            type="button"
            variant="outline"
            onClick={() => appendSeason({ numeroTemporada: seasonFields.length + 1, episodios: [] })}
            >
            <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Temporada
            </Button>
        </div>
        {seasonFields.length === 0 && (
            <p className="text-muted-foreground text-center py-4">Nenhuma temporada adicionada. Clique em "Adicionar Temporada" para começar.</p>
        )}
        <div className="space-y-6">
          {seasonFields.map((season, index) => (
            <SeasonItem
              key={season.id}
              control={control}
              seasonIndex={index}
              removeSeason={removeSeason}
              register={register}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
