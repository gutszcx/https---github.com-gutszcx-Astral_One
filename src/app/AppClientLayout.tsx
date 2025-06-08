
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Toaster } from "@/components/ui/toaster";
import { HomeAniDetailModal } from '@/components/homeani/HomeAniDetailModal';
import { useModal } from '@/contexts/ModalContext';
import { Button } from '@/components/ui/button';
import { Search as SearchIcon, Star, Loader2, User as UserIcon, LogOut, UserCircle, CalendarDays, History as HistoryIcon, ExternalLink, PlayCircle, LayoutDashboard, Settings, Sun, Moon, Calendar as CalendarLucideIcon } from 'lucide-react'; // Added Sun, Moon, CalendarLucideIcon
import { useState, useEffect } from 'react';
import { SearchDialog } from '@/components/SearchDialog';
import { NewsBanner } from '@/components/layout/NewsBanner';
import { AnimeCalendarHighlightBanner } from '@/components/layout/AnimeCalendarHighlightBanner';
import { AnimeLoadingScreen } from '@/components/layout/AnimeLoadingScreen'; // Import da nova tela de carregamento
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import { getAuth, onAuthStateChanged, User, signOut } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { usePathname, useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { RecentActivityProvider, useRecentActivity } from '@/contexts/RecentActivityContext';
import type { ContinueWatchingItem } from '@/types';
import { useTheme } from '@/contexts/ThemeContext';
import { initializeFirebaseMessaging, deleteCurrentToken } from '@/lib/firebaseMessaging';


function AvatarDropdownContent() {
  const { user, handleSignOut } = useUserAuth();
  const { mostRecentItem } = useRecentActivity();
  const { openModal } = useModal();
  const { theme, toggleTheme } = useTheme();

  if (!user) return null;

  const getDisplayedTitle = (item: ContinueWatchingItem) => {
    if (item.contentType === 'series' && item._playActionData) {
      const season = (item as any).temporadas?.find((s: any) => s.numeroTemporada === item._playActionData!.seasonNumber);
      // Ensure episodeIndex is valid
      const episodeIndex = item._playActionData!.episodeIndex;
      const episode = season?.episodios?.[episodeIndex];
      if (episode) {
        return item.tituloOriginal + " - T" + season.numeroTemporada + "E" + (item._playActionData.episodeIndex + 1) + ": " + episode.titulo;
      }
    }
    return item.tituloOriginal;
  };

  return (
    <DropdownMenuContent className="w-80 mt-2 p-0" align="end">
      <div className="p-3 border-b border-[hsl(var(--border))] mb-1">
        <div className="flex justify-center mb-3">
          <Image
            src="https://i.postimg.cc/ZKyGZfPs/Chat-GPT-Image-8-de-jun-de-2025-10-20-23.png"
            alt="Astral One Mini Logo"
            width={80}
            height={24}
            className="rounded-sm"
            style={{ height: 'auto' }}
            data-ai-hint="website logo small"
          />
        </div>
        <div className="flex flex-col items-center">
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
      </div>

      <ScrollArea className="max-h-96"> 
        <div className="px-1 py-1">
          <DropdownMenuItem asChild>
            <Link href="/favorites" className="cursor-pointer">
              <Star className="mr-2 h-4 w-4" />
              <span>Meus Favoritos</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link href="/anime-calendar" className="cursor-pointer">
              <CalendarLucideIcon className="mr-2 h-4 w-4" />
              <span>Calendário Anime</span>
            </Link>
          </DropdownMenuItem>
          
          <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="focus:bg-transparent cursor-default !px-1">
            <div className="flex items-center justify-between w-full">
              <div className='flex items-center'>
                {theme === 'light' ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                <Label htmlFor="theme-toggle-switch" className="text-sm font-normal cursor-pointer">
                  Tema {theme === 'light' ? 'Claro' : 'Escuro'}
                </Label>
              </div>
              <Switch
                id="theme-toggle-switch"
                checked={theme === 'dark'}
                onCheckedChange={toggleTheme}
                aria-label="Alternar tema claro/escuro"
              />
            </div>
          </DropdownMenuItem>
          
          <DropdownMenuItem asChild>
            <Link href="/settings" className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              <span>Configurações</span>
            </Link>
          </DropdownMenuItem>


          {mostRecentItem && (
            <>
              <DropdownMenuSeparator />
              <div className="px-2 py-1.5 text-sm font-semibold flex items-center text-muted-foreground">
                <HistoryIcon className="mr-2 h-4 w-4" /> Assistido Recentemente
              </div>
              <div
                className="mx-1 mb-1 p-2 rounded-md hover:bg-accent cursor-pointer group"
                onClick={() => openModal(mostRecentItem, 'play')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') openModal(mostRecentItem, 'play'); }}
              >
                <div className="flex items-center space-x-2">
                  <div className="relative w-12 h-[71px] rounded flex-shrink-0 overflow-hidden bg-muted">
                    <Image
                      src={mostRecentItem.capaPoster || `https://placehold.co/80x120.png?text=${encodeURIComponent(mostRecentItem.tituloOriginal.substring(0,1))}`}
                      alt={`Poster de ${getDisplayedTitle(mostRecentItem)}`}
                      fill
                      sizes="(max-width: 768px) 10vw, 5vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-200"
                      data-ai-hint={mostRecentItem.contentType === "movie" ? "movie poster small" : "tv show poster small"}
                    />
                  </div>
                  <div className="flex-grow min-w-0">
                    <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors" title={getDisplayedTitle(mostRecentItem)}>
                      {getDisplayedTitle(mostRecentItem)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {mostRecentItem.contentType === 'movie' ? 'Filme' : 'Série'}
                      {mostRecentItem.anoLancamento && ` - ${mostRecentItem.anoLancamento}`}
                    </p>
                    <span className="text-xs text-primary group-hover:underline flex items-center mt-1">
                      <PlayCircle className="mr-1 h-3.5 w-3.5" /> Continuar
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}

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
        </div>
      </ScrollArea>
    </DropdownMenuContent>
  );
}

function useUserAuth() {
  const [user, setUser] = useState<User | null>(null);
  const auth = getAuth(app);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        initializeFirebaseMessaging(currentUser, toast);
      } 
    });
    return () => unsubscribe();
  }, [auth, toast]); 

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast({ title: "Deslogado com Sucesso!", description: "Obrigado pela visita! Volte sempre." });
      router.push('/login');
    } catch (error) {
      console.error("Sign out error:", error);
      toast({ title: "Erro ao Sair", description: "Não foi possível desconectar. Tente novamente.", variant: "destructive" });
    }
  };
  return { user, handleSignOut };
}


export function AppClientLayout({ children }: { children: React.ReactNode }) {
  const { selectedItem, isModalOpen, closeModal, initialModalAction, onInitialActionConsumed } = useModal();
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  const auth = getAuth(app);
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useUserAuth();
   const { theme } = useTheme(); 
   const { toast } = useToast(); 

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setIsLoadingAuth(false);
    });
    return () => unsubscribe();
  }, [auth]);


  useEffect(() => {
    if (!isLoadingAuth) {
      const allowedNonAuthPaths = ['/login', '/manage'];
      if (!user && !allowedNonAuthPaths.includes(pathname)) {
        router.push('/login');
      } else if (user && pathname === '/login') {
        router.push('/');
      }
    }
  }, [user, pathname, router, isLoadingAuth]);


  if (isLoadingAuth) {
    // Mostra tela de carregamento genérica enquanto verifica o estado de autenticação
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Verificando autenticação...</p>
      </div>
    );
  }

  const allowedNonAuthPaths = ['/login', '/manage'];
  if (!user && !allowedNonAuthPaths.includes(pathname)) {
    // Se não estiver logado e tentar acessar página protegida, mostra loader antes de redirecionar
    // (o useEffect acima cuidará do redirecionamento)
    return (
       <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Redirecionando para login...</p>
      </div>
    );
  }

  if (user && pathname === '/login') {
    // Se estiver logado e na página de login, mostra a nova tela de carregamento temática
    return <AnimeLoadingScreen message="Carregando seu universo Astral One..." />;
  }

  const showAnimeCalendarBanner = user && !['/login', '/manage', '/anime-calendar', '/offline'].includes(pathname);
  const showNewsBanner = !['/manage', '/offline'].includes(pathname);

  return (
    <RecentActivityProvider>
      <FavoritesProvider>
        {pathname !== '/login' && (
          <header className="bg-background/80 backdrop-blur-md text-card-foreground shadow-md sticky top-0 z-50 border-b border-border">
            
            <nav className="container mx-auto flex justify-between items-center p-1">
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
              {(user || pathname === '/manage') && ( 
                <div className="flex items-center space-x-2 md:space-x-3">
                 {user && ( 
                    <>
                       <Button variant="ghost" size="sm" asChild>
                        <Link href="/manage" aria-label="Painel" className="flex items-center">
                          <LayoutDashboard className="h-5 w-5 text-primary mr-1 sm:mr-1.5" />
                          <span className="hidden sm:inline">Painel</span>
                        </Link>
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href="/favorites" aria-label="Favoritos" className="flex items-center">
                          <Star className="h-5 w-5 text-primary mr-1 sm:mr-1.5" />
                          <span className="hidden sm:inline">Favoritos</span>
                        </Link>
                      </Button>
                    </>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => setIsSearchDialogOpen(true)} aria-label="Pesquisar conteúdo" className="flex items-center">
                    <SearchIcon className="h-5 w-5 text-primary mr-1 sm:mr-1.5" />
                    <span className="hidden sm:inline">Pesquisar</span>
                  </Button>
                  {user && ( 
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
                      <AvatarDropdownContent />
                    </DropdownMenu>
                  )}
                  {!user && pathname === '/manage' && ( 
                     <Button variant="ghost" size="sm" asChild>
                        <Link href="/login" aria-label="Login" className="flex items-center">
                          <UserIcon className="h-5 w-5 text-primary mr-1 sm:mr-1.5" />
                          <span className="hidden sm:inline">Login</span>
                        </Link>
                      </Button>
                  )}
                </div>
              )}
            </nav>
          </header>
        )}
        {showAnimeCalendarBanner && <AnimeCalendarHighlightBanner />}
        {showNewsBanner && <NewsBanner />}
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
        {(user || pathname === '/manage') && ( 
           <SearchDialog
             isOpen={isSearchDialogOpen}
             onClose={() => setIsSearchDialogOpen(false)}
           />
        )}
      </FavoritesProvider>
    </RecentActivityProvider>
  );
}

