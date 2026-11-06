import { useLanguage } from '@eduos/ui';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useInstitution } from '../../../../components/layout/institution-shell';
import { LanguageSettings } from '../../../../components/settings/language-settings';

function Page() {
  const { t } = useLanguage();

  const { institutionId, access } = useInstitution();
  const canConfigureAdmissions =
    access.modules.includes('admissions') && access.permissions.includes('admissions.settings');
  return (
    <div>
      <h1 className="text-2xl font-semibold">{t('Settings')}</h1>
      <p className="mt-2 text-muted-foreground">{t('Manage your school’s module settings.')}</p>
      <LanguageSettings />
      {canConfigureAdmissions ? (
        <Link
          to="/institutions/$institutionId/settings/admissions"
          params={{ institutionId }}
          className="admission-nav mt-7 block rounded-md border border-border p-4"
        >
          <span className="font-medium">{t('Admissions settings')}</span>
          <span className="mt-1 block text-muted-foreground">
            {t('Fees, follow-up reminders and class offerings.')}{' '}
          </span>
        </Link>
      ) : (
        <output className="mt-7 block">
          {t('No settings are available for your current role and enabled modules.')}{' '}
        </output>
      )}
    </div>
  );
}

export const Route = createFileRoute('/institutions/$institutionId/settings/')({ component: Page });
