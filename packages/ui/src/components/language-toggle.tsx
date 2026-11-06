import { useLanguage } from '../i18n/language-provider.js';

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();
  return (
    <fieldset className="language-toggle" aria-label="ভাষা / Language">
      <button
        type="button"
        lang="bn"
        aria-pressed={language === 'bn'}
        onClick={() => setLanguage('bn')}
      >
        বাংলা
      </button>
      <button
        type="button"
        lang="en"
        aria-pressed={language === 'en'}
        onClick={() => setLanguage('en')}
      >
        English
      </button>
    </fieldset>
  );
}
