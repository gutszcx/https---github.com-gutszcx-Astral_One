
// src/components/cine-form/EpisodeItem.tsx
'use client';

import type { Control, UseFieldArrayRemove, UseFormRegister } from 'react-hook-form';
import { useFieldArray } from 'react-hook-form';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, PlusCircle, Film, Link, Code } from 'lucide-react';
import type { SeriesFormValues, VideoSource as VideoSourceType } from '@/lib/schemas'; // Import VideoSourceType
import { Separator } from '@/components/ui/separator';

interface EpisodeItemProps {
  control: Control<SeriesFormValues>;
  seasonIndex: number;
  episodeIndex: number;
  removeEpisode: UseFieldArrayRemove;
  register: UseFormRegister<SeriesFormValues>;
}

export function EpisodeItem({ control, seasonIndex, episodeIndex, removeEpisode }: EpisodeItemProps) {
  const { fields: videoSourceFields, append: appendVideoSource, remove: removeVideoSource } = useFieldArray({
    control,
    name: `temporadas.${seasonIndex}.episodios.${episodeIndex}.videoSources`,
  });

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
          className="text-destructive hover:text-destructive/80"
        >
          <Trash2 className="h-4 w-4" />
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

      <Separator />
      <div>
        <div className="flex justify-between items-center mb-2">
          <h5 className="text-sm font-medium flex items-center">
            <Film className="mr-2 h-4 w-4 text-primary/70" /> Fontes de Vídeo do Episódio
          </h5>
          <Button
            type="button"
            variant="outline"
            size="xs" 
            onClick={() => appendVideoSource({ serverName: '', sourceType: 'directUrl', content: '' } as VideoSourceType)}
          >
            <PlusCircle className="mr-1 h-3 w-3" /> Adicionar Fonte
          </Button>
        </div>
        {videoSourceFields.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-1">Nenhuma fonte de vídeo para este episódio.</p>
        )}
        <div className="space-y-3">
          {videoSourceFields.map((sourceField, sourceIndex) => (
            <div key={sourceField.id} className="p-3 border rounded-md space-y-2 bg-muted/30">
              <div className="flex justify-between items-center">
                <FormLabel className="text-xs">Fonte {sourceIndex + 1}</FormLabel>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-destructive hover:text-destructive/80"
                  onClick={() => removeVideoSource(sourceIndex)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              <FormField
                control={control}
                name={`temporadas.${seasonIndex}.episodios.${episodeIndex}.videoSources.${sourceIndex}.serverName`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Nome do Servidor</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Servidor A (HD)" {...field} className="text-xs h-8" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name={`temporadas.${seasonIndex}.episodios.${episodeIndex}.videoSources.${sourceIndex}.sourceType`}
                render={({ field: typeField }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Tipo de Fonte</FormLabel>
                    <Select onValueChange={typeField.onChange} defaultValue={typeField.value}>
                      <FormControl>
                        <SelectTrigger className="text-xs h-8">
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="directUrl">
                           <div className="flex items-center"><Link className="mr-2 h-3.5 w-3.5" />URL Direta</div>
                        </SelectItem>
                        <SelectItem value="embedCode">
                           <div className="flex items-center"><Code className="mr-2 h-3.5 w-3.5" />Código de Embed</div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name={`temporadas.${seasonIndex}.episodios.${episodeIndex}.videoSources.${sourceIndex}.content`}
                render={({ field: contentField }) => {
                  const currentSourceType = (control.getValues() as SeriesFormValues)
                    .temporadas?.[seasonIndex]
                    ?.episodios?.[episodeIndex]
                    ?.videoSources?.[sourceIndex]?.sourceType;
                  return (
                    <FormItem>
                       <FormLabel className="text-xs">
                        {currentSourceType === 'embedCode' ? 'Código de Embed (iframe)' : 'URL do Vídeo'}
                      </FormLabel>
                      <FormControl>
                        {currentSourceType === 'embedCode' ? (
                          <Textarea
                            placeholder="Cole o código de embed <iframe ...> aqui"
                            {...contentField}
                            rows={3}
                            className="text-xs"
                          />
                        ) : (
                          <Input
                            type="url"
                            placeholder="https://exemplo.com/ep1.mp4"
                            {...contentField}
                            className="text-xs h-8"
                          />
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            </div>
          ))}
        </div>
      </div>
      
      <Separator />

      <FormField
        control={control}
        name={`temporadas.${seasonIndex}.episodios.${episodeIndex}.linkLegenda`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Link da Legenda (Para URLs diretas - Opcional)</FormLabel>
            <FormControl>
              <Input type="url" placeholder="https://exemplo.com/ep1.vtt" {...field} value={field.value ?? ''}/>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
