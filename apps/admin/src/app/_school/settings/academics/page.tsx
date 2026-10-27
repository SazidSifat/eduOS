import { createFileRoute } from '@tanstack/react-router';
import { AcademicSettings } from '../_component/academic-settings';

function Page() {
  return <AcademicSettings />;
}

export const Route = createFileRoute('/_school/settings/academics/')({
  component: Page,
});
