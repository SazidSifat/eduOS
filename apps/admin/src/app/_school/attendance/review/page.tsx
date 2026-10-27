import { createFileRoute } from '@tanstack/react-router';
import { AttendanceReview } from '../_component/attendance-review';

function Page() {
  return <AttendanceReview />;
}

export const Route = createFileRoute('/_school/attendance/review/')({
  component: Page,
});
