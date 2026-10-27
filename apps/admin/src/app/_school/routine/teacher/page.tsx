import { createFileRoute } from '@tanstack/react-router';
import { TeacherRoutine } from '../_component/teacher-routine';

function Page() {
  return <TeacherRoutine />;
}

export const Route = createFileRoute('/_school/routine/teacher/')({
  component: Page,
});
