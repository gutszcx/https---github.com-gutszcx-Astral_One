
// src/components/cine-form/MovieFields.tsx
'use client';

import type { Control } from 'react-hook-form';
import { useFieldArray, useWatch } from 'react-hook-form'; // Import useWatch
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Trash2, Film, Link, Code } from 'lucide-react';
import type { MovieFormValues } from '@/lib/schemas';
import { Separator } from '@/components/ui/separator';

interface MovieFieldsProps {
  control: Control<MovieFormValues>;
}

export function MovieFields({ control }: MovieFieldsProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'videoSources',
  });

  return (
    <div className="space-y-6">
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-medium flex items-center">
            <Film className="mr-2 h-5 w-5 text-primary/80" /> Fontes de Vídeo
          </h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ serverName: '', sourceType: 'directUrl', content: '' })}
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Fonte
          </Button>
        </div>
        {fields.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-2">Nenhuma fonte de vídeo adicionada.</p>
        )}
        <div className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="p-4 border rounded-md space-y-3 bg-muted/20 shadow-sm">
              <div className="flex justify-between items-center">
                <FormLabel className="text-sm font-medium">Fonte {index + 1}</FormLabel>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(index)}
                  className="text-destructive hover:text-destructive/80"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <FormField
                control={control}
                name={`videoSources.${index}.serverName`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Nome do Servidor</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Servidor A (Dublado)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name={`videoSources.${index}.sourceType`}
                render={({ field: typeField }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Tipo de Fonte</FormLabel>
                    <Select onValueChange={typeField.onChange} defaultValue={typeField.value}>
                      <FormControl>
                        <SelectTrigger>
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
                name={`videoSources.${index}.content`}
                render={({ field: contentField }) => {
                  const currentSourceType = useWatch({
                    control,
                    name: `videoSources.${index}.sourceType`,
                  });
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
                          />
                        ) : (
                          <Input
                            type="url"
                            placeholder="https://exemplo.com/filme.mp4"
                            {...contentField}
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
        name="linkLegendas"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Link das Legendas (Global para fontes diretas - Opcional)</FormLabel>
            <FormControl>
              <Input type="url" placeholder="https://exemplo.com/legenda.vtt" {...field} value={field.value ?? ''} />
            </FormControl>
            <FormDescription>Insira o link direto para o arquivo de legenda (VTT, SRT, etc.). Usado com URLs diretas.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
