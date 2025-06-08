// src/app/offline/page.tsx
'use client';

import { WifiOff } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function OfflinePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-6 text-center">
      <div className="bg-card p-8 md:p-12 rounded-lg shadow-xl border border-[hsl(var(--cyberpunk-border))]">
        <WifiOff className="h-20 w-20 sm:h-24 sm:w-24 text-primary mb-6 sm:mb-8 mx-auto" />
        <h1 className="text-3xl sm:text-4xl font-bold text-primary mb-3 sm:mb-4">Você está offline!</h1>
        <p className="text-lg sm:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-md">
          Parece que não há conexão com a internet. Verifique sua rede e tente novamente.
        </p>
        <p className="text-sm sm:text-md text-muted-foreground mb-5 sm:mb-6">
          Algumas funcionalidades podem não estar disponíveis enquanto você estiver offline.
        </p>
        <Button asChild className="cyberpunk-button-primary text-base sm:text-lg py-2.5 px-6">
          <Link href="/">Tentar Recarregar</Link>
        </Button>
      </div>
    </main>
  );
}
