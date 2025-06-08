
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { app } from '@/lib/firebase';
import { AlertTriangle } from 'lucide-react';

export default function LoginPage() {
  const auth = getAuth(app);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true); // Start as true to check auth state
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if already logged in, or set loading to false if not
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.push('/'); // Redirect to homepage
      } else {
        setIsLoading(false); // No user, stop loading and show login page
      }
    });
    return () => unsubscribe();
  }, [auth, router]);

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    setError(null);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // onAuthStateChanged will handle the redirect to '/' upon successful sign-in
    } catch (err: any) {
      console.error("Google Sign-In Error:", err);
      let friendlyMessage = "Falha ao fazer login com o Google. Tente novamente.";
      if (err.code === 'auth/popup-closed-by-user') {
        friendlyMessage = "A janela de login foi fechada. Tente novamente.";
      } else if (err.code === 'auth/cancelled-popup-request') {
        friendlyMessage = "Múltiplas tentativas de login. Por favor, tente novamente.";
      }
      setError(friendlyMessage);
    } finally {
      setIsSigningIn(false);
    }
  };

  if (isLoading) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
        {/* You can add a more sophisticated loader here if desired */}
        <svg className="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="mt-4 text-muted-foreground">Verificando autenticação...</p>
      </main>
    );
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
      <Card className="w-full max-w-md shadow-2xl border border-[hsl(var(--cyberpunk-border))] bg-card">
        <CardHeader className="text-center p-6 space-y-4">
          <div className="mx-auto">
            <Image
              src="https://chatgpt.com/s/m_68458e10ada88191989eaf020a0bd3ea"
              alt="Logo Astral One"
              width={200}
              height={60}
              className="rounded-md"
              data-ai-hint="website logo brand"
            />
          </div>
          <CardTitle className="text-3xl font-bold text-primary">Bem-vindo ao Astral One!</CardTitle>
          <CardDescription className="text-muted-foreground text-lg">
            Faça login com sua conta Google para explorar um universo de filmes e séries.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <Button
            onClick={handleGoogleSignIn}
            disabled={isSigningIn}
            className="w-full text-lg py-3 cyberpunk-button-primary focus:ring-2 focus:ring-offset-2 focus:ring-[hsl(var(--cyberpunk-highlight))] focus:ring-offset-[hsl(var(--cyberpunk-bg))]"
            size="lg"
          >
            {isSigningIn ? (
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="mr-2 h-5 w-5" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                <path fill="currentColor" d="M488 261.8C488 403.3 381.5 512 244 512 110.5 512 0 401.5 0 265.5S110.5 19 244 19c70.5 0 131.5 31.5 173.5 78.5l-67.5 64.5C313.5 125.5 280.5 103 244 103c-63.5 0-114.5 50.5-114.5 113S180.5 329 244 329c37.5 0 61-15 77-30l69.5 66.5C391.5 400.5 326 435 244 435c-106 0-192-86-192-192s86-192 192-192c100.5 0 176.5 68.5 176.5 173.5 0 15-1.5 29-4.5 43H244v88h133.5c-6.5 30.5-23.5 57.5-47.5 75z"></path>
              </svg>
            )}
            {isSigningIn ? 'Entrando...' : 'Entrar com Google'}
          </Button>
          {error && (
            <div className="mt-4 p-3 bg-destructive/20 text-destructive border border-destructive/50 rounded-md flex items-center text-sm">
              <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="p-6 text-center">
            <p className="text-xs text-muted-foreground">
                Ao continuar, você concorda com nossos <a href="#" className="underline hover:text-primary transition-colors">Termos de Serviço</a> e <a href="#" className="underline hover:text-primary transition-colors">Política de Privacidade</a>.
            </p>
        </CardFooter>
      </Card>
    </main>
  );
}
