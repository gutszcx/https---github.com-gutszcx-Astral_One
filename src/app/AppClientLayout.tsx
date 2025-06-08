
'use client';

import Link from 'next/link';
import Image from 'next/image'; // Ensure Image is imported
import { Toaster } from "@/components/ui/toaster";
import { HomeAniDetailModal } from '@/components/homeani/HomeAniDetailModal';
import { useModal } from '@/contexts/ModalContext';
import { Button } from '@/components/ui/button';
import { Search as SearchIcon, Star, Loader2, User as UserIcon, LogOut, UserCircle, CalendarDays, History as HistoryIcon, ExternalLink } from 'lucide-react';
import { useState, useEffect } from 'react';
import { SearchDialog } from '@/components/SearchDialog';
import { NewsBanner } from '@/components/layout/NewsBanner';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import { getAuth, onAuthStateChanged, User, signOut } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { usePathname, useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

export function AppClientLayout({ children }: { children: React.ReactNode }) {
  const { selectedItem, isModalOpen, closeModal, initialModalAction, onInitialActionConsumed } = useModal();
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();

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

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast({ title: "Deslogado com Sucesso!", description: "Você foi desconectado." });
      router.push('/login'); // Redirect to login after sign out
    } catch (error) {
      console.error("Sign out error:", error);
      toast({ title: "Erro ao Sair", description: "Não foi possível desconectar. Tente novamente.", variant: "destructive" });
    }
  };

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
                width={130} 
                height={39} 
                className="rounded-sm"
                style={{ height: 'auto' }} 
                priority 
                data-ai-hint="website logo brand"
              />
            </Link>
            {user && (
              <div className="flex items-center space-x-2 md:space-x-4">
                <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors hidden sm:inline-block">
                  Catálogo
                </Link>
                <Link href="/favorites" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center">
                  <Star className="mr-1 h-4 w-4" /> <span className="hidden sm:inline-block">Favoritos</span>
                </Link>
                <Link href="/manage" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors hidden sm:inline-block">
                  Gerenciar
                </Link>
                <Button variant="ghost" size="icon" onClick={() => setIsSearchDialogOpen(true)} aria-label="Pesquisar conteúdo">
                  <SearchIcon className="h-5 w-5 text-primary hover:text-[hsl(var(--cyberpunk-highlight))]" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Avatar className="h-8 w-8 cursor-pointer ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                      {user.photoURL ? (
                        <AvatarImage src={user.photoURL} alt={user.displayName || 'User avatar'} />
                      ) : null}
                      <AvatarFallback>
                        {user.displayName ? (
                          user.displayName.substring(0, 2).toUpperCase()
                        ) : (
                          <UserIcon className="h-4 w-4" />
                        )}
                      </AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64 mr-4 mt-2" align="end">
                    <div className="flex flex-col items-center p-3 border-b border-[hsl(var(--cyberpunk-border))] mb-1">
                      <Image
                        src="https://i.postimg.cc/ZKyGZfPs/Chat-GPT-Image-8-de-jun-de-2025-10-20-23.png"
                        alt="Astral One Mini Logo"
                        width={80}
                        height={24} 
                        className="rounded-sm mb-3" 
                        style={{ height: 'auto' }}
                        data-ai-hint="website logo small"
                      />
                      <Avatar className="h-16 w-16 mb-2">
                        {user.photoURL ? (
                          <AvatarImage src={user.photoURL} alt={user.displayName || 'User avatar'} />
                        ) : null}
                        <AvatarFallback>
                          {user.displayName ? (
                            user.displayName.substring(0, 2).toUpperCase()
                          ) : (
                            <UserIcon className="h-8 w-8" />
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <p className="font-semibold text-foreground text-center">{user.displayName || "Usuário"}</p>
                      {user.email && <p className="text-xs text-muted-foreground text-center">{user.email}</p>}
                    </div>
                    <DropdownMenuItem asChild>
                      <Link href="/favorites" className="cursor-pointer">
                        <Star className="mr-2 h-4 w-4" />
                        <span>Meus Favoritos</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                       <Link href="/" className="cursor-pointer">
                        <HistoryIcon className="mr-2 h-4 w-4" />
                        <span>Assistido recentemente</span>
                       </Link>
                    </DropdownMenuItem>
                     {user.metadata.creationTime && (
                      <DropdownMenuItem disabled className="opacity-70 cursor-default">
                        <CalendarDays className="mr-2 h-4 w-4" />
                        <span>Membro desde: {format(new Date(user.metadata.creationTime), 'dd/MM/yyyy', { locale: ptBR })}</span>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sair</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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

    