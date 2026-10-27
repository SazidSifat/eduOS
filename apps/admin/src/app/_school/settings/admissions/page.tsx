import { createFileRoute } from '@tanstack/react-router';
import { SchoolSettings } from '../_component/school-settings';

function Page() {
  return <SchoolSettings kind="admissions" />;
}

export const Route = createFileRoute('/_school/settings/admissions/')({
  component: Page,
});
