import { useLanguage } from '@eduos/ui';
import { useState } from 'react';
import { Button } from '@eduos/ui';
import { useAdmissions } from './admissions-shell';
import { AdmissionOfferingForm, AdmissionSettingsForm } from './admission-settings';

export function CandidateSetup() {
  const { t } = useLanguage();

  const { access, setup } = useAdmissions();
  const [expanded, setExpanded] = useState(false);
  const missingSettings = !setup.settings.version;
  const missingOfferings = !setup.offerings.length;
  if (!missingSettings && !missingOfferings) return null;
  const canConfigure = access.permissions.includes('admissions.settings');
  return (
    <section aria-label={t('School setup')} className="mb-6 rounded-md border border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="max-w-2xl text-muted-foreground">
          {canConfigure
            ? t(
                'You can fill in the student form now. Save school settings and add a class/session here before saving the record.',
              )
            : t(
                'You can fill in the student form now. An Admin or Principal must save school settings and add a class/session before this record can be saved.',
              )}
        </p>
        {canConfigure && (
          <Button
            variant="outline"
            aria-expanded={expanded}
            aria-controls="inline-school-setup"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? t('Hide school setup') : t('Complete school setup')}
          </Button>
        )}
      </div>
      {canConfigure && expanded && (
        <div id="inline-school-setup" className="mt-5">
          {missingSettings && <AdmissionSettingsForm key={setup.settings.version} />}
          {missingOfferings && <AdmissionOfferingForm />}
        </div>
      )}
    </section>
  );
}
