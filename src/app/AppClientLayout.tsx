
'use client';

import Link from 'next/link';
import { Toaster } from "@/components/ui/toaster";
import { HomeAniDetailModal } from '@/components/homeani/HomeAniDetailModal';
import { useModal } from '@/contexts/ModalContext';
import { Button } from '@/components/ui/button';
import { Search as SearchIcon } from 'lucide-react';
import { useState } from 'react';
import { SearchDialog } from '@/components/SearchDialog';
import { NewsBanner } from '@/components/layout/NewsBanner'; // Added import

export function AppClientLayout({ children }: { children: React.ReactNode }) {
  const { selectedItem, isModalOpen, closeModal, initialModalAction, onInitialActionConsumed } = useModal();
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);

  return (
    <>
      <NewsBanner /> 
      <header className="bg-card text-card-foreground p-4 shadow-md sticky top-0 z-50 border-b border-[hsl(var(--cyberpunk-border))]">
        <nav className="container mx-auto flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-primary hover:text-[hsl(var(--cyberpunk-highlight))] transition-colors">
            CineForm
          </Link>
          <div className="flex items-center space-x-6">
            <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Catálogo
            </Link>
            <Link href="/manage" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Gerenciar Conteúdo
            </Link>
            <Button variant="ghost" size="icon" onClick={() => setIsSearchDialogOpen(true)} aria-label="Pesquisar conteúdo">
              <SearchIcon className="h-5 w-5 text-primary hover:text-[hsl(var(--cyberpunk-highlight))]" />
            </Button>
          </div>
        </nav>
      </header>
      <main className="flex-grow">
        {children}
      </main>
      <Toaster />
      <HomeAniDetailModal
        item={selectedItem}
        isOpen={isModalOpen}
        onClose={closeModal}
        initialAction={initialModalAction}
        onInitialActionConsumed={onInitialActionConsumed}
      />
      <SearchDialog 
        isOpen={isSearchDialogOpen}
        onClose={() => setIsSearchDialogOpen(false)}
      />
    </>
  );
}
