// src/components/cine-form/ContentLibrary.tsx
'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getContentItems, deleteContentItem } from '@/lib/firebaseService';
import { Button } from '@/components/ui/button';
import { Loader2, ListOrdered, Trash2, Edit3, AlertTriangle, RefreshCw } from 'lucide-react';
import { ContentLibraryItem } from './ContentLibraryItem';
import type { StoredCineItem } from '@/types';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Separator } from '../ui/separator';

interface ContentLibraryProps {
  onEditItem: (item: StoredCineItem) => void;
}

export function ContentLibrary({ onEditItem }: ContentLibraryProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const { data: items, isLoading, error, refetch } = useQuery<StoredCineItem[], Error>({
    queryKey: ['contentItems'],
    queryFn: getContentItems,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteContentItem,
    onSuccess: () => {
      toast({ title: "Item Excluído!", description: "O conteúdo foi removido da biblioteca." });
      queryClient.invalidateQueries({ queryKey: ['contentItems'] });
      setItemToDelete(null);
    },
    onError: (err) => {
      toast({ title: "Erro ao Excluir", description: err.message || "Não foi possível excluir o item.", variant: "destructive" });
      setItemToDelete(null);
    },
  });

  const handleDeleteRequest = (itemId: string) => {
    setItemToDelete(itemId);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      deleteMutation.mutate(itemToDelete);
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-6xl mx-auto mt-8 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center"><ListOrdered className="mr-3 h-7 w-7 text-primary"/>Biblioteca de Conteúdo</CardTitle>
           <CardDescription>Carregando seus filmes e séries...</CardDescription>
        </CardHeader>
        <CardContent className="p-6 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-6xl mx-auto mt-8 shadow-lg border-destructive">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center text-destructive-foreground"><AlertTriangle className="mr-3 h-7 w-7"/>Erro ao Carregar</CardTitle>
          <CardDescription className="text-destructive-foreground/80">Não foi possível carregar a biblioteca.</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
            <p className="text-destructive-foreground mb-4">{error.message}</p>
            <Button onClick={() => refetch()} variant="secondary">
                <RefreshCw className="mr-2 h-4 w-4" />
                Tentar Novamente
            </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-6xl mx-auto mt-12 shadow-xl">
      <CardHeader className="bg-muted/30 p-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <div >
                <CardTitle className="text-2xl font-headline text-primary flex items-center">
                    <ListOrdered className="mr-3 h-7 w-7" />
                    Biblioteca de Conteúdo
                </CardTitle>
                <CardDescription>Gerencie seus filmes e séries cadastrados.</CardDescription>
            </div>
            <Button onClick={() => refetch()} variant="outline" size="sm" disabled={isLoading || deleteMutation.isPending}>
                <RefreshCw className={`mr-2 h-4 w-4 ${isLoading || deleteMutation.isPending ? 'animate-spin' : ''}`} />
                Atualizar Lista
            </Button>
        </div>
      </CardHeader>
      <Separator/>
      <CardContent className="p-6 md:p-8">
        {items && items.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {items.map((item) => (
              <ContentLibraryItem 
                key={item.id} 
                item={item} 
                onEdit={onEditItem}
                onDelete={handleDeleteRequest}
                isDeleting={deleteMutation.isPending && itemToDelete === item.id}
              />
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">Sua biblioteca está vazia. Adicione novo conteúdo usando o formulário acima.</p>
        )}
      </CardContent>

      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este item? Esta ação não poderá ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setItemToDelete(null)} disabled={deleteMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deleteMutation.isPending} className="bg-destructive hover:bg-destructive/90">
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
