import { createFileRoute } from '@tanstack/react-router';
import { AdmissionSettingsPage } from '../../admissions/_component/admission-settings';
import { AdmissionsProvider } from '../../admissions/_component/admissions-shell';
import { useInstitution } from '../../../../../components/layout/institution-shell';

function Page() {
  const { access } = useInstitution();
  if (!access.permissions.includes('admissions.settings')) {
    return <p role="alert">Only an Admin or Principal can configure admissions.</p>;
  }
  return (
    <AdmissionsProvider>
      <AdmissionSettingsPage />
    </AdmissionsProvider>
  );
}

export const Route = createFileRoute('/institutions/$institutionId/settings/admissions/')({
  component: Page,
});
