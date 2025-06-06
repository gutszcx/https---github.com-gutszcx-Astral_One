
'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Search, X, Film, Tv } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getContentItems } from '@/lib/firebaseService';
import type { StoredCineItem } from '@/types';
import { useModal } from '@/contexts/ModalContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from './ui/badge';

interface SearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchDialog({ isOpen, onClose }: SearchDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { openModal } = useModal();

  const { data: allItems, isLoading: isLoadingItems, error } = useQuery<StoredCineItem[], Error>({
    queryKey: ['contentItemsSearchDialog'],
    queryFn: getContentItems,
    enabled: isOpen, // Only fetch when the dialog is open
  });

  const filteredItems = useMemo(() => {
    if (!allItems) return [];
    if (!searchQuery.trim()) return []; // Return empty if search query is empty

    const lowerCaseQuery = searchQuery.toLowerCase();
    return allItems.filter(item =>
      item.tituloOriginal.toLowerCase().includes(lowerCaseQuery) ||
      (item.tituloLocalizado && item.tituloLocalizado.toLowerCase().includes(lowerCaseQuery))
    );
  }, [allItems, searchQuery]);

  useEffect(() => {
    // Reset search query when dialog opens/closes
    if (!isOpen) {
      setSearchQuery('');
    }
  }, [isOpen]);

  const handleItemClick = (item: StoredCineItem) => {
    openModal(item);
    onClose(); // Close search dialog after opening detail modal
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] md:max-w-[700px] p-0 max-h-[80vh] flex flex-col cyberpunk-alert-dialog-content">
        <DialogHeader className="p-6 pb-4 border-b border-[hsl(var(--cyberpunk-border))]">
          <DialogTitle className="text-2xl flex items-center cyberpunk-alert-dialog-title">
            <Search className="mr-2 h-6 w-6" /> Pesquisar Conteúdo
          </DialogTitle>
          <DialogDescription className="cyberpunk-alert-dialog-description">
            Digite o nome do filme ou série que você está procurando.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6">
          <Input
            type="text"
            placeholder="Buscar por título..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-base h-12"
            autoFocus
          />
        </div>

        <ScrollArea className="flex-grow px-6 pb-1 min-h-[200px]">
          {isLoadingItems && searchQuery.trim() && (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          {error && searchQuery.trim() && (
            <p className="text-destructive text-center">Erro ao carregar itens: {error.message}</p>
          )}
          {!isLoadingItems && searchQuery.trim() && filteredItems.length === 0 && (
            <p className="text-muted-foreground text-center py-8">Nenhum resultado encontrado para "{searchQuery}".</p>
          )}
          {searchQuery.trim() && filteredItems.length > 0 && (
            <ul className="space-y-3">
              {filteredItems.map(item => (
                <li key={item.id}>
                  <button
                    onClick={() => handleItemClick(item)}
                    className="w-full flex items-start p-3 rounded-md hover:bg-[hsl(var(--cyberpunk-bg-lighter)/0.5)] border border-transparent hover:border-[hsl(var(--cyberpunk-secondary-accent)/0.5)] transition-all text-left focus:outline-none focus:ring-2 focus:ring-[hsl(var(--cyberpunk-highlight))]"
                  >
                    <div className="relative w-16 h-24 mr-4 flex-shrink-0 bg-muted rounded overflow-hidden">
                      <Image
                        src={item.capaPoster || `https://placehold.co/100x150.png?text=${encodeURIComponent(item.tituloOriginal.substring(0,1))}`}
                        alt={`Poster de ${item.tituloOriginal}`}
                        layout="fill"
                        objectFit="cover"
                        data-ai-hint={item.contentType === "movie" ? "movie poster" : "tv show poster"}
                      />
                    </div>
                    <div className="flex-grow">
                      <h3 className="font-semibold text-foreground text-lg">{item.tituloOriginal}</h3>
                      {item.tituloLocalizado && item.tituloLocalizado !== item.tituloOriginal && (
                        <p className="text-sm text-muted-foreground">{item.tituloLocalizado}</p>
                      )}
                      <div className="text-xs text-muted-foreground mt-1 flex items-center space-x-2">
                        {item.contentType === 'movie' ? <Film className="h-3.5 w-3.5" /> : <Tv className="h-3.5 w-3.5" />}
                        <span>{item.contentType === 'movie' ? 'Filme' : 'Série'}</span>
                        {item.anoLancamento && <span>&bull; {item.anoLancamento}</span>}
                        {item.qualidade && <Badge variant="outline" className="text-xs px-1 py-0">{item.qualidade}</Badge>}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
           {!searchQuery.trim() && !isLoadingItems && (
             <p className="text-muted-foreground text-center py-8">Comece a digitar para ver os resultados.</p>
           )}
        </ScrollArea>

        <DialogFooter className="p-4 border-t border-[hsl(var(--cyberpunk-border))] bg-[hsl(var(--cyberpunk-bg-lighter)/0.5)]">
          <DialogClose asChild>
            <Button type="button" variant="outline" className="cyberpunk-button-cancel">
              <X className="mr-2 h-4 w-4" /> Fechar
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
