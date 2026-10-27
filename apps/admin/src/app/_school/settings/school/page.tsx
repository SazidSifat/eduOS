import { createFileRoute } from '@tanstack/react-router';
import { SchoolSettings } from '../_component/school-settings';

function Page() {
  return <SchoolSettings kind="school" />;
}

export const Route = createFileRoute('/_school/settings/school/')({
  component: Page,
});
