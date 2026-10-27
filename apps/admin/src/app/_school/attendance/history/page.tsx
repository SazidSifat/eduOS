import { createFileRoute } from '@tanstack/react-router';
import { AttendanceHistory } from '../_component/attendance-history';

function Page() {
  return <AttendanceHistory />;
}

export const Route = createFileRoute('/_school/attendance/history/')({
  component: Page,
});
