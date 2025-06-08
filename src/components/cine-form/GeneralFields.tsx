
// src/components/cine-form/GeneralFields.tsx
'use client';

import type { Control } from 'react-hook-form';
import { useFieldArray } from 'react-hook-form';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2, Link2 } from 'lucide-react';
import type { CineFormValues } from '@/lib/schemas';
import { CLASSIFICACAO_INDICATIVA_OPTIONS, QUALIDADE_OPTIONS, IDIOMA_OPTIONS, GENERO_OPTIONS } from '@/lib/schemas';
import { Separator } from '../ui/separator';

interface GeneralFieldsProps {
  control: Control<CineFormValues>;
}

export function GeneralFields({ control }: GeneralFieldsProps) {
  const { fields: embedUrlFields, append: appendEmbedUrl, remove: removeEmbedUrl } = useFieldArray({
    control,
    name: 'embedUrls',
  });

  return (
    <div className="space-y-6">
      <FormField
        control={control}
        name="tituloOriginal"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Título Original</FormLabel>
            <FormControl>
              <Input placeholder="Ex: The Matrix" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="tituloLocalizado"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Título Localizado (Opcional)</FormLabel>
            <FormControl>
              <Input placeholder="Ex: Matrix" {...field} value={field.value ?? ''} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="sinopse"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Sinopse/Descrição</FormLabel>
            <FormControl>
              <Textarea placeholder="Breve descrição do conteúdo..." {...field} value={field.value ?? ''} rows={4} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="generos"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Gêneros</FormLabel>
            <FormControl>
              <Input placeholder="Ação, Comédia, Drama (separados por vírgula)" {...field} value={field.value ?? ''} />
            </FormControl>
            <FormDescription>
              Liste os gêneros separados por vírgula. Ex: Ação, Ficção Científica
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={control}
          name="idiomaOriginal"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Idioma Original</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o idioma original" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {IDIOMA_OPTIONS.map(idioma => (
                    <SelectItem key={idioma} value={idioma}>{idioma}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="dublagensDisponiveis"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dublagens Disponíveis (Opcional)</FormLabel>
              <FormControl>
                <Input placeholder="Português, Inglês (separados por vírgula)" {...field} value={field.value ?? ''}/>
              </FormControl>
               <FormDescription>
                Liste os idiomas de dublagem separados por vírgula.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={control}
          name="anoLancamento"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ano de Lançamento</FormLabel>
              <FormControl>
                <Input type="number" placeholder="Ex: 2023" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="duracaoMedia"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Duração Média (minutos)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="Ex: 120" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))} />
              </FormControl>
              <FormDescription>Para séries, pode ser a duração média de um episódio.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={control}
          name="classificacaoIndicativa"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Classificação Indicativa</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a classificação" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {CLASSIFICACAO_INDICATIVA_OPTIONS.map(opt => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="qualidade"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Qualidade</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a qualidade" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {QUALIDADE_OPTIONS.map(opt => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={control}
        name="capaPoster"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Capa (Poster URL)</FormLabel>
            <FormControl>
              <Input type="url" placeholder="https://exemplo.com/poster.jpg" {...field} value={field.value ?? ''}/>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="bannerFundo"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Banner de Fundo (Background URL)</FormLabel>
            <FormControl>
              <Input type="url" placeholder="https://exemplo.com/banner.jpg" {...field} value={field.value ?? ''}/>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="tags"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tags ou Palavras-chave (Opcional)</FormLabel>
            <FormControl>
              <Input placeholder="Ação, Aventura, Viagem no Tempo (separadas por vírgula)" {...field} value={field.value ?? ''}/>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <Separator />

      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-medium flex items-center">
            <Link2 className="mr-2 h-5 w-5 text-primary/80" /> Links de Embed (Opcional)
          </h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => appendEmbedUrl({ url: '' })}
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Link Embed
          </Button>
        </div>
        {embedUrlFields.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-2">Nenhum link de embed adicionado.</p>
        )}
        <div className="space-y-4">
          {embedUrlFields.map((field, index) => (
            <div key={field.id} className="p-4 border rounded-md space-y-3 bg-muted/20 shadow-sm">
              <div className="flex justify-between items-center">
                <FormLabel className="text-sm font-medium">Link Embed {index + 1}</FormLabel>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeEmbedUrl(index)}
                  className="text-destructive hover:text-destructive/80"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <FormField
                control={control}
                name={`embedUrls.${index}.url`}
                render={({ field: embedField }) => (
                  <FormItem>
                    <FormLabel className="text-xs">URL do Embed</FormLabel>
                    <FormControl>
                      <Input type="url" placeholder="Ex: https://www.youtube.com/embed/VIDEO_ID" {...embedField} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          ))}
        </div>
      </div>


      <Separator />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <FormField
          control={control}
          name="destaqueHome"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Destaque na Home</FormLabel>
                <FormDescription>
                  Marcar para destacar este conteúdo na página inicial.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status do Conteúdo</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
