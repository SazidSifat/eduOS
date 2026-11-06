export type TranslationCatalog = Readonly<Record<string, string>>;
export type Language = 'bn' | 'en';
export const languageStorageKey = 'eduos-language';
export type TranslationValues = Record<string, string | number | undefined>;

export function translate(
  text: string | undefined,
  language: Language,
  values?: TranslationValues,
  catalog: TranslationCatalog = {},
): string {
  if (text === undefined) return '';
  const translated =
    language === 'bn' && Object.hasOwn(catalog, text) ? (catalog[text] ?? text) : text;
  return translated.replace(/\{(\w+)\}/g, (match: string, key: string) =>
    values && Object.hasOwn(values, key) ? String(values[key] ?? '') : match,
  );
}

export function formatMoney(minor: number, language: Language): string {
  const amount = (minor / 100).toLocaleString(language === 'bn' ? 'bn-BD' : 'en-BD', {
    maximumFractionDigits: 2,
  });
  return `${language === 'bn' ? '৳' : 'BDT'} ${amount}`;
}
