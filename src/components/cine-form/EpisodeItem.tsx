// src/components/cine-form/EpisodeItem.tsx
'use client';

import type { Control, UseFieldArrayRemove, UseFormRegister } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import type { SeriesFormValues } from '@/lib/schemas';

interface EpisodeItemProps {
  control: Control<SeriesFormValues>;
  seasonIndex: number;
  episodeIndex: number;
  removeEpisode: UseFieldArrayRemove;
  register: UseFormRegister<SeriesFormValues>;
}

export function EpisodeItem({ control, seasonIndex, episodeIndex, removeEpisode, register }: EpisodeItemProps) {
  return (
    <div className="p-4 border rounded-md space-y-4 bg-background shadow-sm">
      <div className="flex justify-between items-center">
        <h4 className="font-medium text-md">Episódio {episodeIndex + 1}</h4>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => removeEpisode(episodeIndex)}
          aria-label="Remover episódio"
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>

      <FormField
        control={control}
        name={`temporadas.${seasonIndex}.episodios.${episodeIndex}.titulo`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Título do Episódio</FormLabel>
            <FormControl>
              <Input placeholder="Ex: Piloto" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={`temporadas.${seasonIndex}.episodios.${episodeIndex}.descricao`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Descrição do Episódio (Opcional)</FormLabel>
            <FormControl>
              <Textarea placeholder="Breve descrição do episódio..." {...field} value={field.value ?? ''} rows={2} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField
          control={control}
          name={`temporadas.${seasonIndex}.episodios.${episodeIndex}.duracao`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Duração (minutos)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="Ex: 45" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={`temporadas.${seasonIndex}.episodios.${episodeIndex}.linkVideo`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Link do Vídeo</FormLabel>
              <FormControl>
                <Input type="url" placeholder="https://exemplo.com/ep1.mp4" {...field} value={field.value ?? ''}/>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={`temporadas.${seasonIndex}.episodios.${episodeIndex}.linkLegenda`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Link da Legenda (Opcional)</FormLabel>
              <FormControl>
                <Input type="url" placeholder="https://exemplo.com/ep1.vtt" {...field} value={field.value ?? ''}/>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
       {/* Upload individual de episódios (vídeo e legenda) - Placeholder */}
    </div>
  );
}
