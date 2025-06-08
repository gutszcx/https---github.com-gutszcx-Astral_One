
// src/components/layout/AnimeLoadingScreen.tsx
'use client';

import { Swords, Sparkles, Shield, Zap } from 'lucide-react';

interface AnimeLoadingScreenProps {
  message: string;
}

export function AnimeLoadingScreen({ message }: AnimeLoadingScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4 overflow-hidden">
      <div className="relative flex items-center justify-center w-52 h-36 md:w-64 md:h-40">
        {/* Elemento 1 (Espadas Cruzadas no centro) */}
        <Swords className="absolute text-primary animate-pulse z-10" size={72} strokeWidth={1.5} />

        {/* Elemento 2 (Escudo atrás como um "impacto" ou defesa) */}
        <Shield 
          className="absolute text-secondary oapcity-50 animate-ping" 
          size={96} 
          strokeWidth={1}
          style={{ animationDuration: '1.5s', opacity: 0.3 }}
        />

        {/* Efeitos de brilho/faísca */}
        <Sparkles
          className="absolute text-yellow-400 animate-ping opacity-75"
          size={32}
          style={{ animationDuration: '1.5s', top: '15%', left: '25%' }}
        />
        <Zap
          className="absolute text-blue-400 animate-ping opacity-60"
          size={24}
          style={{ animationDelay: '0.3s', bottom: '20%', right: '20%', animationDuration: '1.8s' }}
        />
         <Sparkles
          className="absolute text-pink-400 animate-ping opacity-75"
          size={28}
          style={{ animationDuration: '1.2s', animationDelay: '0.5s', top: '65%', left: '15%' }}
        />
          <Sparkles
          className="absolute text-green-400 animate-pulse opacity-65"
          size={20}
          style={{ animationDelay: '0.7s', bottom: '15%', right: '55%', animationDuration: '2s' }}
        />
      </div>
      <p className="mt-8 text-xl md:text-2xl font-semibold text-primary">{message}</p>
      <p className="text-muted-foreground text-sm md:text-base">Prepare-se para a ação!</p>
    </div>
  );
}
