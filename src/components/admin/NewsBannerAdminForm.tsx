
// src/components/admin/NewsBannerAdminForm.tsx
'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save, MessageSquareText } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { setNewsBannerMessage, getNewsBannerMessage } from '@/lib/firebaseService';
import type { NewsBannerMessage, NewsBannerMessageType } from '@/types';
import { NEWS_BANNER_TYPES } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '../ui/separator';

const newsBannerSchema = z.object({
  message: z.string().min(1, "A mensagem é obrigatória.").max(300, "Mensagem muito longa (máx 300 caracteres)."),
  type: z.enum(NEWS_BANNER_TYPES).default('none'),
  isActive: z.boolean().default(false),
  link: z.string().url({ message: "URL inválida." }).optional().or(z.literal('')),
  linkText: z.string().max(50, "Texto do link muito longo.").optional(),
}).refine(data => !data.link || (data.link && data.linkText && data.linkText.trim() !== ''), {
  message: "O texto do link é obrigatório se uma URL for fornecida.",
  path: ["linkText"],
});

type NewsBannerFormValues = z.infer<typeof newsBannerSchema>;

const defaultValues: NewsBannerFormValues = {
  message: '',
  type: 'none',
  isActive: false,
  link: '',
  linkText: '',
};

export function NewsBannerAdminForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: currentBanner, isLoading: isLoadingBanner } = useQuery<NewsBannerMessage | null>({
    queryKey: ['newsBannerControls'],
    queryFn: getNewsBannerMessage,
  });

  const form = useForm<NewsBannerFormValues>({
    resolver: zodResolver(newsBannerSchema),
    defaultValues: defaultValues,
  });

  useEffect(() => {
    if (currentBanner) {
      form.reset({
        message: currentBanner.message || '',
        type: currentBanner.type || 'none',
        isActive: currentBanner.isActive || false,
        link: currentBanner.link || '',
        linkText: currentBanner.linkText || '',
      });
    } else {
      form.reset(defaultValues);
    }
  }, [currentBanner, form]);

  const mutation = useMutation({
    mutationFn: async (values: NewsBannerFormValues) => {
      await setNewsBannerMessage(values);
    },
    onSuccess: () => {
      toast({
        title: "Banner de Notícias Atualizado!",
        description: "A mensagem do banner foi salva com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['newsBannerControls'] });
      queryClient.invalidateQueries({ queryKey: ['newsBannerClient'] }); // To refresh banner on client pages
    },
    onError: (error) => {
      toast({
        title: "Erro ao Salvar",
        description: error.message || "Não foi possível salvar a mensagem do banner.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: NewsBannerFormValues) => {
    mutation.mutate(values);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto mt-8 shadow-lg">
      <CardHeader className="bg-muted/30 p-6">
        <CardTitle className="text-2xl font-headline text-primary flex items-center">
          <MessageSquareText className="mr-3 h-7 w-7" />
          Gerenciar Banner de Notícias
        </CardTitle>
        <CardDescription>Controle a mensagem exibida no topo das páginas para os usuários.</CardDescription>
      </CardHeader>
      <Separator />
      <CardContent className="p-6 md:p-8">
        {isLoadingBanner ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-3 text-muted-foreground">Carregando configuração atual...</p>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mensagem do Banner</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Digite a notícia ou aviso aqui..." {...field} rows={3} />
                    </FormControl>
                    <FormDescription>Esta mensagem será exibida no banner.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Mensagem</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {NEWS_BANNER_TYPES.map(type => (
                            <SelectItem key={type} value={type}>
                              {type.charAt(0).toUpperCase() + type.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>Define a cor e ícone do banner.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-col justify-center">
                      <FormLabel className="mb-2">Status do Banner</FormLabel>
                      <div className="flex items-center space-x-2 p-2.5 border rounded-md h-10">
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} id="banner-active" />
                        </FormControl>
                        <label htmlFor="banner-active" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                           {field.value ? "Ativo" : "Inativo"} (Exibir no site)
                        </label>
                      </div>
                       <FormDescription className="mt-2">Controla a visibilidade do banner.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="link"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Link (Opcional)</FormLabel>
                    <FormControl>
                      <Input type="url" placeholder="https://exemplo.com/noticia" {...field} />
                    </FormControl>
                    <FormDescription>Se preenchido, o banner terá um link.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="linkText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Texto do Link (Opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Saiba Mais" {...field} />
                    </FormControl>
                    <FormDescription>Texto para o botão/link (se houver link).</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <CardFooter className="px-0 pt-6 flex justify-end">
                <Button type="submit" size="lg" disabled={mutation.isPending}>
                  {mutation.isPending ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-5 w-5" />
                  )}
                  Salvar Configuração do Banner
                </Button>
              </CardFooter>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}
