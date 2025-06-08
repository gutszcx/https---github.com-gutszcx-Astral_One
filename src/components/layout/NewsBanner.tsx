
// src/components/layout/NewsBanner.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
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
  success: 'default', 
  warning: 'default', 
  error: 'destructive',
  none: 'default',
};

const colorClasses: Record<NewsBannerMessageType, string> = {
    none: 'bg-card text-card-foreground border-border',
    info: 'bg-accent/20 text-accent-foreground border-accent/50 [&>svg]:text-accent',
    success: 'bg-green-500/20 text-green-400 border-green-500/50 [&>svg]:text-green-400',
    warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50 [&>svg]:text-yellow-400',
    error: 'border-destructive/50 text-destructive bg-destructive/10 [&>svg]:text-destructive',
};


export function NewsBanner() {
  const [isVisible, setIsVisible] = useState(false); // Start as false
  const { data: bannerMessage, isLoading } = useQuery<NewsBannerMessage | null>({
    queryKey: ['newsBannerClient'], 
    queryFn: getNewsBannerMessage,
    refetchOnWindowFocus: true, 
    staleTime: 5 * 60 * 1000, 
  });

  const handleDismiss = useCallback(() => {
    setIsVisible(false);
    if (bannerMessage?.message) {
      sessionStorage.setItem('dismissedNewsBannerMessage', bannerMessage.message);
      if (bannerMessage.updatedAt) {
        sessionStorage.setItem(`dismissedNewsBannerTime-${bannerMessage.updatedAt}`, 'true');
      }
    }
  }, [bannerMessage]);

  useEffect(() => {
    if (bannerMessage?.isActive) {
      const dismissedMessage = sessionStorage.getItem('dismissedNewsBannerMessage');
      const dismissedTimeKey = `dismissedNewsBannerTime-${bannerMessage.updatedAt}`;
      const hasBeenDismissedForThisVersion = sessionStorage.getItem(dismissedTimeKey);

      if (dismissedMessage !== bannerMessage.message || !hasBeenDismissedForThisVersion) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    } else {
      setIsVisible(false); // If banner is not active in DB, ensure it's not visible
    }
  }, [bannerMessage]);

  useEffect(() => {
    let timerId: NodeJS.Timeout | null = null;

    if (isVisible && bannerMessage?.isActive) {
      timerId = setTimeout(() => {
        handleDismiss();
      }, 15000); // Changed from 5000 to 15000 (15 seconds)
    }

    return () => {
      if (timerId) {
        clearTimeout(timerId);
      }
    };
  }, [isVisible, bannerMessage, handleDismiss]);

  if (isLoading || !bannerMessage || !bannerMessage.isActive || !bannerMessage.message || !isVisible) {
    return null;
  }

  const IconComponent = iconMap[bannerMessage.type] || Megaphone;

  return (
    <div className={cn(
      "fixed bottom-6 right-6 z-[60] w-full max-w-md rounded-lg shadow-2xl bg-card border border-border p-0",
      "animate-in fade-in slide-in-from-bottom-10 duration-500 ease-out" 
    )}>
      <Alert
        variant={variantMap[bannerMessage.type]}
        className={cn(
          "relative items-center",
          colorClasses[bannerMessage.type]
        )}
      >
        <IconComponent className="h-5 w-5" />
        <AlertTitle className={cn("font-semibold ml-2")}>
          {bannerMessage.type.charAt(0).toUpperCase() + bannerMessage.type.slice(1)}
        </AlertTitle>
        <AlertDescription className={cn("flex-grow pr-10")}>
          {bannerMessage.message}
          {bannerMessage.link && bannerMessage.linkText && (
            <Link 
              href={bannerMessage.link} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="inline-flex items-center cyberpunk-button-secondary text-sm ml-3 px-2 py-0.5 h-auto"
            >
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
            "text-muted-foreground hover:text-foreground"
          )}
          aria-label="Fechar banner"
        >
          <X className="h-4 w-4" />
        </Button>
      </Alert>
    </div>
  );
}
