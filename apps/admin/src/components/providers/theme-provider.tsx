import { useEffect, type ReactNode } from 'react';
import { useResolvedTheme } from '../../stores/theme-store';
export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useResolvedTheme();
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);
  return children;
}
