import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { PaymentReview } from '../../_component/payment-review';

function Page() {
  const { studentId } = Route.useParams();
  return <PaymentReview studentId={studentId} />;
}

export const Route = createFileRoute('/_school/fees/$studentId/review/')({
  params: { parse: (params) => z.object({ studentId: z.string().min(1).max(100) }).parse(params) },
  component: Page,
});
