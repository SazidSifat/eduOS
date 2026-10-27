import { createFileRoute } from '@tanstack/react-router';
import { DailyAttendance } from './_component/daily-attendance';

function Page() {
  return <DailyAttendance />;
}

export const Route = createFileRoute('/_school/attendance/')({
  component: Page,
});
