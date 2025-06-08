
// src/contexts/ThemeContext.tsx
'use client';

import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { createContext, useState, useEffect, useContext, useCallback } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextProps {
  theme: Theme;
  setTheme: Dispatch<SetStateAction<Theme>>;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light'); // Default to light

  useEffect(() => {
    // Load theme from localStorage on initial mount
    const storedTheme = localStorage.getItem('app-theme') as Theme | null;
    if (storedTheme) {
      setTheme(storedTheme);
    } else {
      // Fallback to system preference if no theme is stored
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }
  }, []);

  useEffect(() => {
    // Apply theme to HTML element and save to localStorage
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    try {
      localStorage.setItem('app-theme', theme);
    } catch (error) {
      console.error("Failed to save theme to localStorage", error);
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
