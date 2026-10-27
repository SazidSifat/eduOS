import { createFileRoute } from '@tanstack/react-router';
import { AttendanceCorrections } from '../_component/attendance-corrections';

function Page() {
  return <AttendanceCorrections />;
}

export const Route = createFileRoute('/_school/attendance/corrections/')({
  component: Page,
});
