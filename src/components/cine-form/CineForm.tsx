// src/components/cine-form/CineForm.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
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
import { Loader2, Film, Tv, Save, CircleX, RefreshCcw } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { cineFormSchema, defaultMovieValues, defaultSeriesValues, type CineFormValues } from '@/lib/schemas';
import { addContentItem, updateContentItem } from '@/lib/firebaseService';
import type { StoredCineItem } from '@/types';
import { GeneralFields } from './GeneralFields';
import { MovieFields } from './MovieFields';
import { SeriesFields } from './SeriesFields';
import { TmdbSearch } from './TmdbSearch';
import { TmdbCastSearch } from './TmdbCastSearch';
import { ContentLibrary } from './ContentLibrary'; // Added import
import { useToast } from '@/hooks/use-toast';


export function CineForm() {
  const [contentType, setContentType] = useState<'movie' | 'series'>('movie');
  const [editingItem, setEditingItem] = useState<StoredCineItem | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const formRef = useRef<HTMLDivElement>(null);


  const form = useForm<CineFormValues>({
    resolver: zodResolver(cineFormSchema),
    defaultValues: contentType === 'movie' ? defaultMovieValues : defaultSeriesValues,
    mode: 'onChange', 
  });

  useEffect(() => {
    if (editingItem) {
      // If editing, set content type from item and reset form with item data
      setContentType(editingItem.contentType);
      // Ensure all fields, including nested ones like temporadas/episodios are correctly set
      let formData = { ...editingItem };
      if (editingItem.contentType === 'series' && !formData.temporadas) {
        formData.temporadas = []; // Ensure temporadas is an array
      } else if (editingItem.contentType === 'movie' && formData.temporadas) {
        delete (formData as any).temporadas; // Remove series specific fields if editing a movie
        delete (formData as any).totalTemporadas;
      }
      form.reset(formData);
    } else {
      // If not editing, reset to default values based on selected contentType
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
    }
  }, [contentType, editingItem, form.reset]);


  const mutation = useMutation({
    mutationFn: async (values: CineFormValues) => {
      if (editingItem) {
        await updateContentItem(editingItem.id, values);
        return { ...values, id: editingItem.id }; 
      } else {
        const newId = await addContentItem(values);
        return { ...values, id: newId };
      }
    },
    onSuccess: (data, variables) => {
      toast({
        title: editingItem ? "Conteúdo Atualizado!" : "Conteúdo Salvo!",
        description: `"${variables.tituloOriginal}" foi ${editingItem ? 'atualizado' : 'salvo'} com sucesso.`,
      });
      queryClient.invalidateQueries({ queryKey: ['contentItems'] });
      queryClient.invalidateQueries({ queryKey: ['contentItemsHomeAni'] }); // Invalidate homepage query
      form.reset(contentType === 'movie' ? defaultMovieValues : defaultSeriesValues);
      setEditingItem(null);
      setContentType('movie'); // Reset to default or last known good state
    },
    onError: (error) => {
      toast({
        title: "Erro ao Salvar",
        description: error.message || "Não foi possível salvar o conteúdo.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: CineFormValues) => {
    // Ensure contentType is correctly passed from form state
    const submissionValues = { ...values, contentType: form.getValues('contentType') as 'movie' | 'series' };
    mutation.mutate(submissionValues);
  };

  const handleEditItemRequest = (item: StoredCineItem) => {
    setEditingItem(item);
    // ContentType and form reset are handled by useEffect [editingItem]
    if (formRef.current) {
        formRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    toast({ title: "Modo de Edição Ativado", description: `Editando "${item.tituloOriginal}".`});
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    form.reset(contentType === 'movie' ? defaultMovieValues : defaultSeriesValues);
    // setContentType is handled by useEffect which will run due to editingItem change
    toast({ title: "Edição Cancelada", description: "Os campos foram resetados."});
  };

  return (
    <>
      <FormProvider {...form}>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div ref={formRef}>
              <Card className="w-full max-w-4xl mx-auto shadow-2xl">
                <CardHeader className="bg-muted/50 p-6">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-3xl font-headline text-primary flex items-center">
                      {form.getValues('contentType') === 'movie' ? <Film className="mr-3 h-8 w-8" /> : <Tv className="mr-3 h-8 w-8" />}
                      {editingItem ? 'Editar Conteúdo' : 'CineForm – Novo Conteúdo'}
                    </CardTitle>
                    {editingItem && (
                        <Button variant="ghost" onClick={handleCancelEdit} size="sm">
                            <CircleX className="mr-2 h-4 w-4" /> Cancelar Edição
                        </Button>
                    )}
                  </div>
                  <CardDescription className="text-lg">
                    {editingItem ? `Modificando "${editingItem.tituloOriginal}".` : 'Adicione filmes e séries de forma fácil e intuitiva.'}
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
                              if (editingItem && value !== editingItem.contentType) {
                                // If user tries to change type while editing, it's a complex scenario.
                                // Simplest is to prevent or reset edit mode. Here, we just update.
                                // Potentially clear specific fields or confirm with user.
                                setEditingItem(null); // Exit edit mode if type changes
                              }
                              setContentType(value as 'movie' | 'series');
                              field.onChange(value as 'movie' | 'series');
                            }}
                            value={field.value} // Use field.value directly
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

                  <TmdbSearch form={form} contentType={form.getValues('contentType')} />

                  <Separator />

                  <TmdbCastSearch /> 

                  <Separator />
                  
                  <div>
                    <h2 className="text-xl font-semibold mb-4 text-primary">Campos Gerais</h2>
                    <GeneralFields control={form.control} />
                  </div>

                  <Separator />

                  {form.getValues('contentType') === 'movie' ? (
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
                  <Button type="submit" size="lg" disabled={mutation.isPending}>
                    {mutation.isPending ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      editingItem ? <RefreshCcw className="mr-2 h-5 w-5" /> : <Save className="mr-2 h-5 w-5" />
                    )}
                    {editingItem ? 'Atualizar Conteúdo' : 'Salvar Conteúdo'}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </form>
        </Form>
      </FormProvider>

      <ContentLibrary onEditItem={handleEditItemRequest} />
    </>
  );
}
