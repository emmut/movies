import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useEffect, useLayoutEffect } from 'react';
export type Theme = 'light' | 'dark' | 'system';

interface ThemeStore {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      theme: 'system',
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'theme',
      partialize: (state) => state.theme,
    }
  )
);

export function useThemeEffect() {
  const { theme } = useThemeStore();

  function handleDarkMode() {
    let shouldBeDark = true;

    if (theme === 'system') {
      shouldBeDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    } else {
      shouldBeDark = theme === 'dark';
    }

    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  useEffect(() => {
    handleDarkMode();
  }, [theme]);

  useEffect(() => {
    const controller = new AbortController();
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    mediaQuery.addEventListener('change', handleDarkMode, {
      signal: controller.signal,
    });
    return () => {
      controller.abort();
    };
  }, []);
}
