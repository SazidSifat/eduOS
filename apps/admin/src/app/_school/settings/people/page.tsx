import { createFileRoute } from '@tanstack/react-router';
import { PeopleSettings } from '../_component/people-settings';

function Page() {
  return <PeopleSettings />;
}

export const Route = createFileRoute('/_school/settings/people/')({
  component: Page,
});
