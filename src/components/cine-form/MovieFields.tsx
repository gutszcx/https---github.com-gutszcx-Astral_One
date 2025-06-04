// src/components/cine-form/MovieFields.tsx
'use client';

import type { Control } from 'react-hook-form';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { MovieFormValues } from '@/lib/schemas';

interface MovieFieldsProps {
  control: Control<MovieFormValues>;
}

export function MovieFields({ control }: MovieFieldsProps) {
  return (
    <div className="space-y-6">
      <FormField
        control={control}
        name="linkVideo"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Link do Vídeo</FormLabel>
            <FormControl>
              <Input type="url" placeholder="https://exemplo.com/filme.mp4" {...field} value={field.value ?? ''} />
            </FormControl>
            <FormDescription>Insira o link direto para o arquivo de vídeo (MP4, M3U8, etc.).</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="linkLegendas"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Link das Legendas (Opcional)</FormLabel>
            <FormControl>
              <Input type="url" placeholder="https://exemplo.com/legenda.vtt" {...field} value={field.value ?? ''} />
            </FormControl>
            <FormDescription>Insira o link direto para o arquivo de legenda (VTT, SRT, etc.).</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      {/* 
      // Opcional: Upload de arquivo (Firebase Storage)
      // Esta funcionalidade requer integração com backend/armazenamento.
      <FormField
        control={control}
        name="uploadArquivo"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Upload do Arquivo (Opcional)</FormLabel>
            <FormControl>
              <Input type="file" onChange={(e) => field.onChange(e.target.files?.[0])} />
            </FormControl>
            <FormDescription>Faça upload do arquivo de vídeo diretamente.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      /> 
      */}
    </div>
  );
}
