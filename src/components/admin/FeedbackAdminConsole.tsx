
// src/components/admin/FeedbackAdminConsole.tsx
'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, MessageSquareHeart, RefreshCw, AlertTriangle, Inbox, ChevronDown, ChevronUp, Send } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { getFeedbackItemsAdmin, updateFeedbackItemAdmin } from '@/lib/firebaseService';
import type { UserFeedbackItem, FeedbackStatus, FeedbackType } from '@/types';
import { FEEDBACK_STATUSES, FEEDBACK_TYPES } from '@/types';
import { adminFeedbackResponseSchema, type AdminFeedbackResponseFormValues } from '@/lib/schemas';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const feedbackTypeLabels: Record<FeedbackType, string> = {
  pedido_conteudo: "Pedido de Conteúdo",
  episodio_offline: "Episódio Offline/Problema",
  problema_geral: "Problema Geral",
  outro: "Outro",
};

const feedbackStatusColors: Record<FeedbackStatus, string> = {
  novo: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
  em_analise: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
  resolvido: 'bg-green-500/20 text-green-400 border-green-500/50',
  recusado: 'bg-red-500/20 text-red-400 border-red-500/50',
};

function FeedbackItemCard({ item }: { item: UserFeedbackItem }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const form = useForm<AdminFeedbackResponseFormValues>({
    resolver: zodResolver(adminFeedbackResponseSchema),
    defaultValues: {
      adminResponse: item.adminResponse || '',
      status: item.status,
    },
  });

  const mutation = useMutation({
    mutationFn: (data: { feedbackId: string; updates: AdminFeedbackResponseFormValues }) =>
      updateFeedbackItemAdmin(data.feedbackId, data.updates),
    onSuccess: () => {
      toast({ title: "Feedback Atualizado!", description: "A resposta e/ou status foram salvos." });
      queryClient.invalidateQueries({ queryKey: ['adminFeedbackItems'] });
    },
    onError: (error) => {
      toast({ title: "Erro ao Atualizar", description: error.message, variant: "destructive" });
    },
  });

  const onSubmit = (values: AdminFeedbackResponseFormValues) => {
    mutation.mutate({ feedbackId: item.id, updates: values });
  };
  
  const submittedAtFormatted = item.submittedAt ? formatDistanceToNow(parseISO(item.submittedAt), { addSuffix: true, locale: ptBR }) : 'Data desconhecida';
  const respondedAtFormatted = item.respondedAt ? formatDistanceToNow(parseISO(item.respondedAt), { addSuffix: true, locale: ptBR }) : 'Ainda não';


  return (
    <Card className="shadow-md bg-card border border-[hsl(var(--cyberpunk-border-secondary))]">
      <AccordionTrigger className="p-4 hover:no-underline">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full">
          <div className="flex-grow mb-2 sm:mb-0">
            <p className="font-semibold text-primary truncate max-w-xs sm:max-w-md md:max-w-lg" title={item.message}>
              {item.message.substring(0, 80)}{item.message.length > 80 ? '...' : ''}
            </p>
            <p className="text-xs text-muted-foreground">
              Tipo: {feedbackTypeLabels[item.feedbackType]} {item.contentTitle && `(${item.contentTitle})`}
            </p>
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0">
            <Badge className={`${feedbackStatusColors[item.status]} text-xs`}>{item.status.replace('_', ' ').toUpperCase()}</Badge>
            <p className="text-xs text-muted-foreground">{submittedAtFormatted}</p>
            <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="p-4 border-t border-[hsl(var(--cyberpunk-border-secondary))]">
        <div className="space-y-3 mb-4">
          <h4 className="font-medium text-sm text-primary">Detalhes do Feedback:</h4>
          <p className="text-sm whitespace-pre-wrap bg-muted/30 p-3 rounded-md">{item.message}</p>
          {item.contentTitle && <p className="text-xs text-muted-foreground">Conteúdo Relacionado: {item.contentTitle} (ID: {item.contentId})</p>}
          <p className="text-xs text-muted-foreground">Enviado: {submittedAtFormatted}</p>
          <p className="text-xs text-muted-foreground">Última Resposta/Status: {respondedAtFormatted}</p>
        </div>
        <Separator className="my-4"/>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="adminResponse"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Sua Resposta (Interna)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Digite sua resposta ou notas internas aqui..." {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Alterar Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {FEEDBACK_STATUSES.map(status => (
                        <SelectItem key={status} value={status}>
                          {status.replace('_', ' ').toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" size="sm" disabled={mutation.isPending} className="cyberpunk-button-primary">
              {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Salvar Resposta/Status
            </Button>
          </form>
        </FormProvider>
      </AccordionContent>
    </Card>
  );
}


export function FeedbackAdminConsole() {
  const { data: feedbackItems, isLoading, error, refetch } = useQuery<UserFeedbackItem[], Error>({
    queryKey: ['adminFeedbackItems'],
    queryFn: getFeedbackItemsAdmin,
  });

  if (isLoading) {
    return (
      <Card className="w-full max-w-4xl mx-auto shadow-lg">
        <CardHeader className="bg-muted/30 p-6">
          <CardTitle className="text-2xl font-headline text-primary flex items-center">
             <MessageSquareHeart className="mr-3 h-7 w-7" /> Console de Feedback de Usuários
          </CardTitle>
          <CardDescription>Carregando feedback dos usuários...</CardDescription>
        </CardHeader>
        <CardContent className="p-6 text-center h-40 flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-4xl mx-auto shadow-lg border-destructive">
        <CardHeader className="p-6">
          <CardTitle className="text-2xl flex items-center text-destructive">
            <AlertTriangle className="mr-3 h-7 w-7" /> Erro ao Carregar Feedback
          </CardTitle>
          <CardDescription className="text-destructive/80">Não foi possível carregar os itens de feedback.</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-destructive mb-4">{error.message}</p>
          <Button onClick={() => refetch()} variant="destructive">
            <RefreshCw className="mr-2 h-4 w-4" /> Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-xl">
      <CardHeader className="bg-muted/30 p-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <div>
                <CardTitle className="text-2xl font-headline text-primary flex items-center">
                    <MessageSquareHeart className="mr-3 h-7 w-7" /> Console de Feedback de Usuários
                </CardTitle>
                <CardDescription>Visualize e gerencie as mensagens e pedidos enviados pelos usuários.</CardDescription>
            </div>
            <Button onClick={() => refetch()} variant="outline" size="sm" disabled={isLoading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Atualizar Lista
            </Button>
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="p-6 md:p-8">
        {feedbackItems && feedbackItems.length > 0 ? (
          <Accordion type="multiple" className="space-y-3">
            {feedbackItems.map((item) => (
              <AccordionItem value={item.id} key={item.id} className="border-none">
                <FeedbackItemCard item={item} />
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <div className="text-center py-10">
            <Inbox className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">Nenhum feedback de usuário recebido ainda.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

