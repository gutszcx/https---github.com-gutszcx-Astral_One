
// src/components/layout/NewsBanner.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { getNewsBannerMessage } from '@/lib/firebaseService';
import type { NewsBannerMessage, NewsBannerMessageType } from '@/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { X, Info, AlertTriangle, CheckCircle, XOctagon, Megaphone, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

const iconMap: Record<NewsBannerMessageType, React.ElementType> = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: XOctagon,
  none: Megaphone,
};

const variantMap: Record<NewsBannerMessageType, 'default' | 'destructive'> = {
  info: 'default',
  success: 'default', // We'll use custom colors for success/warning
  warning: 'default',
  error: 'destructive',
  none: 'default',
};

const colorClasses: Record<NewsBannerMessageType, string> = {
    none: 'bg-card text-card-foreground border-border',
    info: 'bg-[hsl(var(--cyberpunk-secondary-accent)/0.2)] text-[hsl(var(--cyberpunk-secondary-accent))] border-[hsl(var(--cyberpunk-secondary-accent)/0.5)] [&>svg]:text-[hsl(var(--cyberpunk-secondary-accent))]',
    success: 'bg-green-500/20 text-green-400 border-green-500/50 [&>svg]:text-green-400', // Custom green
    warning: 'bg-[hsl(var(--cyberpunk-highlight)/0.2)] text-[hsl(var(--cyberpunk-highlight))] border-[hsl(var(--cyberpunk-highlight)/0.5)] [&>svg]:text-[hsl(var(--cyberpunk-highlight))]',
    error: 'border-destructive/50 text-destructive bg-destructive/20 [&>svg]:text-destructive',
};


export function NewsBanner() {
  const [isVisible, setIsVisible] = useState(true);
  const { data: bannerMessage, isLoading } = useQuery<NewsBannerMessage | null>({
    queryKey: ['newsBannerClient'], // Use a different key than admin to avoid conflicts if admin page is open
    queryFn: getNewsBannerMessage,
    refetchOnWindowFocus: true, // Refetch if window gains focus
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  useEffect(() => {
    // When banner message changes from Firebase, if it's active, make it visible again.
    if (bannerMessage?.isActive) {
      // Check if this specific message was previously dismissed in this session
      const dismissedMessage = sessionStorage.getItem('dismissedNewsBannerMessage');
      if (dismissedMessage !== bannerMessage.message || !sessionStorage.getItem(`dismissedNewsBannerTime-${bannerMessage.updatedAt}`)) {
        setIsVisible(true);
      }
    }
  }, [bannerMessage]);

  const handleDismiss = () => {
    setIsVisible(false);
    if (bannerMessage?.message) {
      sessionStorage.setItem('dismissedNewsBannerMessage', bannerMessage.message);
      if (bannerMessage.updatedAt) {
        sessionStorage.setItem(`dismissedNewsBannerTime-${bannerMessage.updatedAt}`, 'true');
      }
    }
  };

  if (isLoading || !bannerMessage || !bannerMessage.isActive || !bannerMessage.message || !isVisible) {
    return null;
  }

  const IconComponent = iconMap[bannerMessage.type] || Megaphone;

  return (
    <div className={cn(
      "w-full p-2 bg-card border-b border-border", // Updated background and border
      "animate-in fade-in slide-in-from-top-8 duration-500 ease-out" 
    )}>
      <Alert
        variant={variantMap[bannerMessage.type]}
        className={cn(
          "container mx-auto relative items-center",
          colorClasses[bannerMessage.type]
        )}
      >
        <IconComponent className="h-5 w-5" />
        <AlertTitle className={cn("font-semibold ml-2", bannerMessage.type === 'error' ? 'text-destructive-foreground' : '')}>
          {bannerMessage.type.charAt(0).toUpperCase() + bannerMessage.type.slice(1)}
        </AlertTitle>
        <AlertDescription className={cn("flex-grow pr-10", bannerMessage.type === 'error' ? 'text-destructive-foreground' : '')}>
          {bannerMessage.message}
          {bannerMessage.link && bannerMessage.linkText && (
            <Link href={bannerMessage.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center cyberpunk-button-primary text-sm ml-3 px-2 py-0.5 h-auto">
              {bannerMessage.linkText} <ExternalLink className="ml-1.5 h-3 w-3" />
            </Link>
          )}
        </AlertDescription>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDismiss}
          className={cn(
            "absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7",
            bannerMessage.type === 'error' ? 'text-destructive-foreground/70 hover:text-destructive-foreground' : 'text-muted-foreground hover:text-foreground'
          )}
          aria-label="Fechar banner"
        >
          <X className="h-4 w-4" />
        </Button>
      </Alert>
    </div>
  );
}

