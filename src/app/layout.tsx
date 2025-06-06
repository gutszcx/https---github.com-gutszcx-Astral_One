
import type { Metadata } from 'next';
import './globals.css';
// QueryProvider and ModalProvider are kept here as they wrap client boundaries
import { QueryProvider } from '@/components/QueryProvider';
import { ModalProvider } from '@/contexts/ModalContext';
import { AppClientLayout } from './AppClientLayout'; // New client component

export const metadata: Metadata = {
  title: 'CineForm',
  description: 'Formulário unificado para filmes e séries',
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
        <link href="https://fonts.googleapis.com/css2?family=VT323&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased min-h-screen flex flex-col bg-background text-foreground">
        <QueryProvider>
          <ModalProvider>
            <AppClientLayout>{children}</AppClientLayout>
          </ModalProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
