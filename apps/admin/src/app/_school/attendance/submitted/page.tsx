import { createFileRoute } from '@tanstack/react-router';
import { AttendanceReview } from '../_component/attendance-review';

function Page() {
  return <AttendanceReview submitted />;
}

export const Route = createFileRoute('/_school/attendance/submitted/')({
  component: Page,
});
