// src/components/cine-form/CineForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Loader2, Film, Tv, Save } from 'lucide-react';

import { cineFormSchema, defaultMovieValues, defaultSeriesValues, type CineFormValues } from '@/lib/schemas';
import { GeneralFields } from './GeneralFields';
import { MovieFields } from './MovieFields';
import { SeriesFields } from './SeriesFields';
import { TmdbSearch } from './TmdbSearch';
import { TmdbCastSearch } from './TmdbCastSearch'; // Added import
import { useToast } from '@/hooks/use-toast';


export function CineForm() {
  const [contentType, setContentType] = useState<'movie' | 'series'>('movie');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<CineFormValues>({
    resolver: zodResolver(cineFormSchema),
    defaultValues: contentType === 'movie' ? defaultMovieValues : defaultSeriesValues,
    mode: 'onChange', 
  });

  useEffect(() => {
    const currentValues = form.getValues();
    const newDefaults = contentType === 'movie' ? defaultMovieValues : defaultSeriesValues;
    
    const preservedValues: Partial<CineFormValues> = {
      tmdbSearchQuery: currentValues.tmdbSearchQuery,
      tituloOriginal: currentValues.tituloOriginal,
      tituloLocalizado: currentValues.tituloLocalizado,
      sinopse: currentValues.sinopse,
      generos: currentValues.generos,
      idiomaOriginal: currentValues.idiomaOriginal,
      dublagensDisponiveis: currentValues.dublagensDisponiveis,
      anoLancamento: currentValues.anoLancamento,
      duracaoMedia: currentValues.duracaoMedia,
      classificacaoIndicativa: currentValues.classificacaoIndicativa,
      qualidade: currentValues.qualidade,
      capaPoster: currentValues.capaPoster,
      bannerFundo: currentValues.bannerFundo,
      tags: currentValues.tags,
      destaqueHome: currentValues.destaqueHome,
      status: currentValues.status,
    };

    form.reset({ ...newDefaults, ...preservedValues, contentType });
  }, [contentType, form.reset]);


  const onSubmit = async (values: CineFormValues) => {
    setIsSubmitting(true);
    console.log('Form Data:', values);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast({
      title: "Conteúdo Salvo!",
      description: `"${values.tituloOriginal}" foi salvo com sucesso.`,
    });
    setIsSubmitting(false);
  };

  return (
    <FormProvider {...form}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card className="w-full max-w-4xl mx-auto shadow-2xl">
            <CardHeader className="bg-muted/50 p-6">
              <CardTitle className="text-3xl font-headline text-primary flex items-center">
                {contentType === 'movie' ? <Film className="mr-3 h-8 w-8" /> : <Tv className="mr-3 h-8 w-8" />}
                CineForm – Formulário Unificado
              </CardTitle>
              <CardDescription className="text-lg">
                Adicione ou edite filmes e séries de forma fácil e intuitiva.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 md:p-8 space-y-8">
              <FormField
                control={form.control}
                name="contentType"
                render={({ field }) => (
                  <FormItem className="space-y-3 p-4 border rounded-lg shadow-sm bg-card">
                    <FormLabel className="text-base font-semibold">Tipo de Conteúdo</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={(value) => {
                          field.onChange(value);
                          setContentType(value as 'movie' | 'series');
                        }}
                        defaultValue={field.value}
                        className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-4"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="movie" id="movieType" />
                          </FormControl>
                          <FormLabel htmlFor="movieType" className="font-normal flex items-center">
                            <Film className="mr-2 h-5 w-5 text-muted-foreground" /> Filme
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="series" id="seriesType" />
                          </FormControl>
                          <FormLabel htmlFor="seriesType" className="font-normal flex items-center">
                            <Tv className="mr-2 h-5 w-5 text-muted-foreground" /> Série
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <TmdbSearch form={form} contentType={contentType} />

              <Separator />

              <TmdbCastSearch /> 

              <Separator />
              
              <div>
                <h2 className="text-xl font-semibold mb-4 text-primary">Campos Gerais</h2>
                <GeneralFields control={form.control} />
              </div>

              <Separator />

              {contentType === 'movie' ? (
                <div>
                  <h2 className="text-xl font-semibold mb-4 text-primary flex items-center">
                    <Film className="mr-2 h-5 w-5" /> Detalhes do Filme
                  </h2>
                  <MovieFields control={form.control as any} />
                </div>
              ) : (
                <div>
                  <h2 className="text-xl font-semibold mb-4 text-primary flex items-center">
                     <Tv className="mr-2 h-5 w-5" /> Detalhes da Série
                  </h2>
                  <SeriesFields control={form.control as any} register={form.register as any} />
                </div>
              )}
            </CardContent>
            <CardFooter className="bg-muted/50 p-6 flex justify-end">
              <Button type="submit" size="lg" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Save className="mr-2 h-5 w-5" />
                )}
                Salvar Conteúdo
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </FormProvider>
  );
}
