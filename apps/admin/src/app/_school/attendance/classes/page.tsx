import { createFileRoute } from '@tanstack/react-router';
import { AttendanceClasses } from '../_component/attendance-classes';

function Page() {
  return <AttendanceClasses />;
}

export const Route = createFileRoute('/_school/attendance/classes/')({
  component: Page,
});
