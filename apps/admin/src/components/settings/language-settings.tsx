import { LanguageToggle, useLanguage } from '@eduos/ui';

export function LanguageSettings() {
  const { t } = useLanguage();

  return (
    <section
      aria-labelledby="language-settings-heading"
      className="my-6 flex flex-wrap items-center justify-between gap-5 rounded-md border border-border bg-background p-5"
    >
      <div>
        <h2 id="language-settings-heading" className="text-base font-semibold">
          {t('Display language')}
        </h2>
        <p className="mt-1 text-base text-muted-foreground">
          {t('Choose Bangla or English. Your preference is saved in this browser.')}
        </p>
      </div>
      <LanguageToggle />
    </section>
  );
}
