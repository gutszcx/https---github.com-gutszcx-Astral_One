
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

// Use ShadCN variants directly, colors will come from globals.css theme
const variantMap: Record<NewsBannerMessageType, 'default' | 'destructive'> = {
  info: 'default',
  success: 'default', 
  warning: 'default', 
  error: 'destructive',
  none: 'default',
};

// Custom color classes for specific banner types, using theme variables
// These are applied on top of default/destructive variants from ShadCN
const colorClasses: Record<NewsBannerMessageType, string> = {
    none: 'bg-card text-card-foreground border-border', // Default card look
    info: 'bg-accent/20 text-accent-foreground border-accent/50 [&>svg]:text-accent', // Using accent from theme
    success: 'bg-green-500/20 text-green-400 border-green-500/50 [&>svg]:text-green-400', // Keeping custom green as it's standard for success
    warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50 [&>svg]:text-yellow-400', // Custom yellow for warning
    error: 'border-destructive/50 text-destructive bg-destructive/10 [&>svg]:text-destructive', // More subtle destructive bg
};


export function NewsBanner() {
  const [isVisible, setIsVisible] = useState(true);
  const { data: bannerMessage, isLoading } = useQuery<NewsBannerMessage | null>({
    queryKey: ['newsBannerClient'], 
    queryFn: getNewsBannerMessage,
    refetchOnWindowFocus: true, 
    staleTime: 5 * 60 * 1000, 
  });

  useEffect(() => {
    if (bannerMessage?.isActive) {
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
      "w-full p-2 bg-card border-b border-border", 
      "animate-in fade-in slide-in-from-top-8 duration-500 ease-out" 
    )}>
      <Alert
        variant={variantMap[bannerMessage.type]} // Uses default or destructive from ShadCN
        className={cn(
          "container mx-auto relative items-center",
          colorClasses[bannerMessage.type] // Apply specific color overrides
        )}
      >
        <IconComponent className="h-5 w-5" /> {/* Icon color will be inherited or set by colorClasses */}
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
              className="inline-flex items-center cyberpunk-button-secondary text-sm ml-3 px-2 py-0.5 h-auto" // Re-using secondary button style
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
            // Use general hover text color from the theme
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
