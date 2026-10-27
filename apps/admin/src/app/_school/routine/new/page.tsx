import { createFileRoute } from '@tanstack/react-router';
import { RoutineConfig } from '../_component/routine-config';

function Page() {
  return <RoutineConfig />;
}

export const Route = createFileRoute('/_school/routine/new/')({
  component: Page,
});
