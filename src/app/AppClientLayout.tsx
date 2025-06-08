
'use client';

import Link from 'next/link';
import Image from 'next/image'; // Added Image import
import { Toaster } from "@/components/ui/toaster";
import { HomeAniDetailModal } from '@/components/homeani/HomeAniDetailModal';
import { useModal } from '@/contexts/ModalContext';
import { Button } from '@/components/ui/button';
import { Search as SearchIcon, Star, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { SearchDialog } from '@/components/SearchDialog';
import { NewsBanner } from '@/components/layout/NewsBanner';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { usePathname, useRouter } from 'next/navigation';

export function AppClientLayout({ children }: { children: React.ReactNode }) {
  const { selectedItem, isModalOpen, closeModal, initialModalAction, onInitialActionConsumed } = useModal();
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  const auth = getAuth(app);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsLoadingAuth(false);
    });
    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    if (!isLoadingAuth) {
      if (!user && pathname !== '/login') {
        router.push('/login');
      } else if (user && pathname === '/login') {
        router.push('/');
      }
    }
  }, [user, pathname, router, isLoadingAuth]);

  if (isLoadingAuth) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Verificando autenticação...</p>
      </div>
    );
  }

  if (!user && pathname !== '/login') {
    return (
       <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Redirecionando para login...</p>
      </div>
    );
  }
  
  if (user && pathname === '/login') {
    return (
       <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Redirecionando para a página inicial...</p>
      </div>
    );
  }


  return (
    <FavoritesProvider>
      {pathname !== '/login' && <NewsBanner />}
      {pathname !== '/login' && (
        <header className="bg-card text-card-foreground p-4 shadow-md sticky top-0 z-50 border-b border-[hsl(var(--cyberpunk-border))]">
          <nav className="container mx-auto flex justify-between items-center">
            <Link href="/" className="hover:opacity-80 transition-opacity">
              <Image
                src="https://i.postimg.cc/ZKyGZfPs/Chat-GPT-Image-8-de-jun-de-2025-10-20-23.png"
                alt="Astral One Logo"
                width={130} // Adjusted width for header
                height={39} // Adjusted height to maintain aspect ratio (approx 200/60 * 130/x)
                className="rounded-sm" // small rounding if any
                priority // Good to have for LCP elements if this is above the fold
                data-ai-hint="website logo brand"
              />
            </Link>
            {user && (
              <div className="flex items-center space-x-4 md:space-x-6">
                <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                  Catálogo
                </Link>
                <Link href="/favorites" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center">
                  <Star className="mr-1 h-4 w-4" /> Favoritos
                </Link>
                <Link href="/manage" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                  Gerenciar Conteúdo
                </Link>
                <Button variant="ghost" size="icon" onClick={() => setIsSearchDialogOpen(true)} aria-label="Pesquisar conteúdo">
                  <SearchIcon className="h-5 w-5 text-primary hover:text-[hsl(var(--cyberpunk-highlight))]" />
                </Button>
              </div>
            )}
          </nav>
        </header>
      )}
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
      {user && (
         <SearchDialog
           isOpen={isSearchDialogOpen}
           onClose={() => setIsSearchDialogOpen(false)}
         />
      )}
    </FavoritesProvider>
  );
}
