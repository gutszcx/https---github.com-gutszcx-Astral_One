
// src/components/feedback/FeedbackDialog.tsx
'use client';

import * as React from 'react'; // Added React import
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Loader2, MessageSquarePlus, Send } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { feedbackFormSchema, type FeedbackFormValues } from '@/lib/schemas';
import { FEEDBACK_TYPES, type FeedbackType } from '@/types';
import { submitUserFeedback } from '@/lib/firebaseService';

interface FeedbackDialogProps {
  isOpen: boolean;
  onClose: () => void;
  contentContext?: { id: string; title: string };
}

const feedbackTypeLabels: Record<FeedbackType, string> = {
  pedido_conteudo: "Pedido de Conteúdo",
  episodio_offline: "Episódio Offline / Problema de Reprodução",
  problema_geral: "Problema Geral na Plataforma",
  outro: "Outro Assunto",
};

export function FeedbackDialog({ isOpen, onClose, contentContext }: FeedbackDialogProps) {
  const { toast } = useToast();
  const form = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackFormSchema),
    defaultValues: {
      feedbackType: undefined, // User must select one
      message: '',
      contentId: contentContext?.id,
      contentTitle: contentContext?.title,
    },
  });

  const mutation = useMutation({
    mutationFn: submitUserFeedback,
    onSuccess: () => {
      toast({
        title: "Feedback Enviado!",
        description: "Obrigado pela sua mensagem. Vamos analisá-la em breve.",
      });
      form.reset({
        feedbackType: undefined,
        message: '',
        contentId: contentContext?.id,
        contentTitle: contentContext?.title,
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Erro ao Enviar Feedback",
        description: error.message || "Não foi possível enviar sua mensagem. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: FeedbackFormValues) => {
    const dataToSend = { ...values };
    if (contentContext) {
      dataToSend.contentId = contentContext.id;
      dataToSend.contentTitle = contentContext.title;
    }
    mutation.mutate(dataToSend);
  };

  const handleDialogClose = () => {
    if (!mutation.isPending) {
      form.reset({ 
        feedbackType: undefined, 
        message: '',
        contentId: contentContext?.id,
        contentTitle: contentContext?.title,
      });
      onClose();
    }
  };
  
  // Update default values if contentContext changes while dialog might be pre-rendered
  React.useEffect(() => {
    form.reset({
      feedbackType: undefined,
      message: '',
      contentId: contentContext?.id,
      contentTitle: contentContext?.title,
    });
  }, [contentContext, form, isOpen]);


  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleDialogClose()}>
      <DialogContent className="sm:max-w-lg cyberpunk-alert-dialog-content">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center cyberpunk-alert-dialog-title">
            <MessageSquarePlus className="mr-2 h-6 w-6" /> Enviar Feedback / Pedido
          </DialogTitle>
          <DialogDescription className="cyberpunk-alert-dialog-description">
            Ajude-nos a melhorar! Reporte problemas, episódios offline ou faça pedidos de novos filmes e séries.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            {contentContext?.title && (
              <FormItem>
                <FormLabel>Conteúdo Relacionado</FormLabel>
                <FormControl>
                  <Input value={contentContext.title} readOnly disabled className="bg-muted/50" />
                </FormControl>
              </FormItem>
            )}
            <FormField
              control={form.control}
              name="feedbackType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Feedback</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {FEEDBACK_TYPES.map(type => (
                        <SelectItem key={type} value={type}>
                          {feedbackTypeLabels[type]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sua Mensagem</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva o problema ou seu pedido com o máximo de detalhes possível..."
                      rows={5}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline" className="cyberpunk-button-cancel" disabled={mutation.isPending}>
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" className="cyberpunk-button-primary" disabled={mutation.isPending}>
                {mutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Enviar Feedback
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
