
import type { Metadata } from 'next';
import Script from 'next/script'; // Importar Script
import './globals.css';
// QueryProvider and ModalProvider are kept here as they wrap client boundaries
import { QueryProvider } from '@/components/QueryProvider';
import { ModalProvider } from '@/contexts/ModalContext';
import { AppClientLayout } from './AppClientLayout'; // New client component
import { ThemeProvider } from '@/contexts/ThemeContext'; // Import ThemeProvider

export const metadata: Metadata = {
  title: 'Astral One',
  description: 'Formulário unificado para filmes e séries',
  manifest: '/manifest.json', // Added manifest link
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <meta name="application-name" content="Astral One" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Astral One" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/icons/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#FF1EB3" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="theme-color" content="#FF1EB3" />
        <link rel="apple-touch-icon" href="https://placehold.co/180x180.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="https://placehold.co/32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="https://placehold.co/16x16.png" />
        <meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no, viewport-fit=cover" />
        
        {/* Google AdSense Script Placeholder */}
        {/* SUBSTITUA 'ca-pub-XXXXXXXXXXXXXXXX' PELO SEU ID DE EDITOR REAL QUANDO TIVER UM */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body className="antialiased min-h-screen flex flex-col bg-background text-foreground">
        <ThemeProvider> {/* Wrap with ThemeProvider */}
          <QueryProvider>
            <ModalProvider>
              <AppClientLayout>{children}</AppClientLayout>
            </ModalProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
