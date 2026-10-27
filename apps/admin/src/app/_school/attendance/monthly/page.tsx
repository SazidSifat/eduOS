import { createFileRoute } from '@tanstack/react-router';
import { AttendanceMonthly } from '../_component/attendance-monthly';

function Page() {
  return <AttendanceMonthly />;
}

export const Route = createFileRoute('/_school/attendance/monthly/')({
  component: Page,
});
