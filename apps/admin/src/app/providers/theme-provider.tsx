import { useEffect, type ReactNode } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
type Theme = 'light' | 'dark' | 'system';
export const useTheme = create<{ theme: Theme; setTheme: (theme: Theme) => void }>()(
  persist((set) => ({ theme: 'system', setTheme: (theme) => set({ theme }) }), {
    name: 'eduos-theme',
    partialize: (state) => ({ theme: state.theme }),
  }),
);
export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useTheme((s) => s.theme);
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const update = () =>
      document.documentElement.classList.toggle(
        'dark',
        theme === 'dark' || (theme === 'system' && media.matches),
      );
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, [theme]);
  return children;
}
