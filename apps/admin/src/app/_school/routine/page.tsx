import { createFileRoute } from '@tanstack/react-router';
import { RoutineBuilder } from './_component/routine-builder';

function Page() {
  return <RoutineBuilder />;
}

export const Route = createFileRoute('/_school/routine/')({
  component: Page,
});
