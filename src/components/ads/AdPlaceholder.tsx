
// src/components/ads/AdPlaceholder.tsx
'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

interface AdPlaceholderProps {
  width?: number | string;
  height?: number | string;
  label?: string;
  className?: string;
  adSlot?: string; // Adicione esta propriedade se for usar para um bloco específico
}

export function AdPlaceholder({
  width = "100%",
  height = 90,
  label = "Espaço Publicitário",
  className,
  adSlot
}: AdPlaceholderProps) {

  // Este useEffect simula o push para adsbygoogle que você faria
  // para blocos de anúncios específicos, APÓS o script principal ter carregado.
  // Para anúncios automáticos, isso pode não ser estritamente necessário aqui,
  // mas é uma boa prática para blocos.
  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      console.log('AdPlaceholder: adsbygoogle.push({}) called for slot:', adSlot || 'auto/general');
    } catch (e) {
      console.error('AdSense push error:', e);
    }
  }, [adSlot]);

  return (
    <div
      className={`bg-muted/50 border-2 border-dashed border-border text-muted-foreground flex flex-col items-center justify-center rounded-lg ${className}`}
      style={{ width: typeof width === 'number' ? `${width}px` : width, height: typeof height === 'number' ? `${height}px` : height }}
      aria-label={label}
    >
      <AlertTriangle className="h-8 w-8 mb-2 opacity-50" />
      <p className="text-sm font-medium">{label}</p>
      <p className="text-xs opacity-70">({`${typeof width === 'number' ? width : 'Responsivo'} x ${height}`})</p>
      {/* 
        Para um bloco de anúncio real, você teria algo como:
        <ins className="adsbygoogle"
             style={{ display: 'block' }}
             data-ad-client="ca-pub-XXXXXXXXXXXXXXXX" // SEU ID DE EDITOR REAL
             data-ad-slot={adSlot} // SEU ID DE BLOCO DE ANÚNCIO REAL
             data-ad-format="auto" // ou o formato que você configurou
             data-full-width-responsive="true"></ins>
        E o useEffect acima ajudaria a inicializá-lo.
      */}
    </div>
  );
}
