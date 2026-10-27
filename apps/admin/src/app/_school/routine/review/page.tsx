import { createFileRoute } from '@tanstack/react-router';
import { RoutineReview } from '../_component/routine-review';

function Page() {
  return <RoutineReview />;
}

export const Route = createFileRoute('/_school/routine/review/')({
  component: Page,
});
