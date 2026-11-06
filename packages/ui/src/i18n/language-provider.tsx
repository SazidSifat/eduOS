import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  formatMoney,
  languageStorageKey,
  translate,
  type Language,
  type TranslationCatalog,
  type TranslationValues,
} from './language.js';

const emptyCatalog: TranslationCatalog = {};

interface LanguageContextValue {
  language: Language;
  locale: 'bn-BD' | 'en-GB';
  setLanguage: (language: Language) => void;
  t: (text: string | undefined, values?: TranslationValues) => string;
  money: (minor: number) => string;
}
// Standalone controls and existing consumers retain English outside an app provider.
const LanguageContext = createContext<LanguageContextValue>({
  language: 'en',
  locale: 'en-GB',
  setLanguage: () => undefined,
  t: (text, values) => translate(text, 'en', values),
  money: (minor) => formatMoney(minor, 'en'),
});

function initialLanguage(fallback: Language): Language {
  try {
    const saved = localStorage.getItem(languageStorageKey);
    return saved === 'bn' || saved === 'en' ? saved : fallback;
  } catch {
    return fallback;
  }
}

export function LanguageProvider({
  children,
  defaultLanguage = 'en',
  translations = emptyCatalog,
}: {
  children: ReactNode;
  defaultLanguage?: Language;
  translations?: TranslationCatalog;
}) {
  const [language, updateLanguage] = useState(() => initialLanguage(defaultLanguage));
  const setLanguage = useCallback((next: Language) => {
    updateLanguage(next);
    try {
      localStorage.setItem(languageStorageKey, next);
    } catch {
      // The current tab still switches when browser storage is unavailable.
    }
  }, []);
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key === languageStorageKey && (event.newValue === 'bn' || event.newValue === 'en'))
        updateLanguage(event.newValue);
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  const t = useCallback(
    (text: string | undefined, values?: TranslationValues) =>
      translate(text, language, values, translations),
    [language, translations],
  );
  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      locale: language === 'bn' ? 'bn-BD' : 'en-GB',
      setLanguage,
      t,
      money: (minor) => formatMoney(minor, language),
    }),
    [language, setLanguage, t],
  );
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export const useLanguage = () => useContext(LanguageContext);
