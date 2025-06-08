// src/components/layout/AnimeLoadingScreen.tsx
'use client';

import { Swords, Sparkles, Shield, Zap } from 'lucide-react';

interface AnimeLoadingScreenProps {
  message: string;
}

export function AnimeLoadingScreen({ message }: AnimeLoadingScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-foreground p-4 overflow-hidden bg-gradient-to-br from-primary via-secondary to-accent">
      <div className="relative flex items-center justify-center w-52 h-36 md:w-64 md:h-40">
        {/* Elemento 1 (Espadas Cruzadas no centro) */}
        <Swords className="absolute text-white/90 animate-pulse z-10" size={72} strokeWidth={1.5} />

        {/* Elemento 2 (Escudo atrás como um "impacto" ou defesa) */}
        <Shield
          className="absolute text-white/50 oapcity-50 animate-ping"
          size={96}
          strokeWidth={1}
          style={{ animationDuration: '1.5s', opacity: 0.3 }}
        />

        {/* Efeitos de brilho/faísca */}
        <Sparkles
          className="absolute text-yellow-300 animate-ping opacity-75"
          size={32}
          style={{ animationDuration: '1.5s', top: '15%', left: '25%' }}
        />
        <Zap
          className="absolute text-blue-300 animate-ping opacity-60"
          size={24}
          style={{ animationDelay: '0.3s', bottom: '20%', right: '20%', animationDuration: '1.8s' }}
        />
         <Sparkles
          className="absolute text-pink-300 animate-ping opacity-75"
          size={28}
          style={{ animationDuration: '1.2s', animationDelay: '0.5s', top: '65%', left: '15%' }}
        />
          <Sparkles
          className="absolute text-green-300 animate-pulse opacity-65"
          size={20}
          style={{ animationDelay: '0.7s', bottom: '15%', right: '55%', animationDuration: '2s' }}
        />
      </div>
      <p className="mt-8 text-2xl md:text-3xl font-bold text-black drop-shadow-[0_1px_1px_rgba(255,255,255,0.7)]">{message}</p>
      <p className="text-black/80 text-base md:text-lg drop-shadow-[0_1px_1px_rgba(255,255,255,0.5)]">Prepare-se para a ação!</p>
    </div>
  );
}
