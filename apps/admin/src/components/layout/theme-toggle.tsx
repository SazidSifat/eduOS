import { useLanguage } from '@eduos/ui';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@eduos/ui';
import { useResolvedTheme, useTheme } from '../../stores/theme-store';

export function ThemeToggle() {
  const { t } = useLanguage();

  const setTheme = useTheme((state) => state.setTheme);
  const dark = useResolvedTheme() === 'dark';

  return (
    <Button
      variant="outline"
      className="size-10 p-0 transition-colors duration-150 ease-out motion-reduce:transition-none"
      aria-label={dark ? t('Switch to light theme') : t('Switch to dark theme')}
      onClick={() => setTheme(dark ? 'light' : 'dark')}
    >
      {dark ? (
        <Sun aria-hidden="true" className="size-4" strokeWidth={1.5} />
      ) : (
        <Moon aria-hidden="true" className="size-4" strokeWidth={1.5} />
      )}
    </Button>
  );
}
