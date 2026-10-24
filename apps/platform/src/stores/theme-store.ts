import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';
export const useTheme = create<{ theme: Theme; setTheme: (value: Theme) => void }>()(
  persist((set) => ({ theme: 'system', setTheme: (theme) => set({ theme }) }), {
    name: 'eduos-platform-theme',
    partialize: (state) => ({ theme: state.theme }),
  }),
);
const query = '(prefers-color-scheme: dark)';
const getSystemDark = () => window.matchMedia(query).matches;
function subscribe(onChange: () => void) {
  const media = window.matchMedia(query);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}
export function useResolvedTheme() {
  const theme = useTheme((state) => state.theme);
  const systemDark = useSyncExternalStore(subscribe, getSystemDark);
  return theme === 'dark' || (theme === 'system' && systemDark) ? 'dark' : 'light';
}
