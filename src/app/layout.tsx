
import type {Metadata} from 'next';
import Link from 'next/link';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { QueryProvider } from '@/components/QueryProvider';

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
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased min-h-screen flex flex-col bg-background text-foreground">
        <QueryProvider>
          <header className="bg-card text-card-foreground p-4 shadow-md sticky top-0 z-50">
            <nav className="container mx-auto flex justify-between items-center">
              <Link href="/" className="text-2xl font-bold text-primary hover:text-primary/80 transition-colors">
                CineForm
              </Link>
              <div className="space-x-6">
                <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                  Catálogo
                </Link>
                <Link href="/manage" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                  Gerenciar Conteúdo
                </Link>
              </div>
            </nav>
          </header>
          {/* The children (page content) will naturally flow below the header. 
              Individual pages use <main className="flex-grow ..."> to fill remaining space. */}
          {children}
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  );
}
