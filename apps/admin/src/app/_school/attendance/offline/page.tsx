import { createFileRoute } from '@tanstack/react-router';
import { AttendanceReview } from '../_component/attendance-review';

function Page() {
  return <AttendanceReview offline />;
}

export const Route = createFileRoute('/_school/attendance/offline/')({
  component: Page,
});
