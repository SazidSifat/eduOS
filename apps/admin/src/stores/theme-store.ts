import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useSyncExternalStore } from 'react';

type Theme = 'light' | 'dark' | 'system';

export const useTheme = create<{ theme: Theme; setTheme: (theme: Theme) => void }>()(
  persist((set) => ({ theme: 'system', setTheme: (theme) => set({ theme }) }), {
    name: 'eduos-theme',
    partialize: (state) => ({ theme: state.theme }),
  }),
);

const systemThemeQuery = '(prefers-color-scheme: dark)';
const getSystemDark = () => window.matchMedia(systemThemeQuery).matches;
function subscribeSystemTheme(onChange: () => void) {
  const media = window.matchMedia(systemThemeQuery);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

export function useResolvedTheme() {
  const theme = useTheme((state) => state.theme);
  const systemDark = useSyncExternalStore(subscribeSystemTheme, getSystemDark);
  return theme === 'dark' || (theme === 'system' && systemDark) ? 'dark' : 'light';
}
