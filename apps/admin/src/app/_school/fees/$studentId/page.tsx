import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { StudentAccount } from '../_component/student-account';

function Page() {
  const { studentId } = Route.useParams();
  return <StudentAccount key={studentId} studentId={studentId} />;
}

export const Route = createFileRoute('/_school/fees/$studentId/')({
  params: { parse: (params) => z.object({ studentId: z.string().min(1).max(100) }).parse(params) },
  component: Page,
});
