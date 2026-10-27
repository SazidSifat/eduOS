import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { ExpensePayment } from '../../_component/expense-payment';

function Page() {
  const { expenseId } = Route.useParams();
  return <ExpensePayment id={expenseId} />;
}

export const Route = createFileRoute('/_school/expenses/$expenseId/payment/')({
  params: { parse: (params) => z.object({ expenseId: z.string().min(1).max(100) }).parse(params) },
  component: Page,
});
