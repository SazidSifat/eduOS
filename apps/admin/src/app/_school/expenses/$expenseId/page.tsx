import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { ExpenseDetail } from '../_component/expense-detail';

function Page() {
  const { expenseId } = Route.useParams();
  return <ExpenseDetail id={expenseId} />;
}

export const Route = createFileRoute('/_school/expenses/$expenseId/')({
  params: { parse: (params) => z.object({ expenseId: z.string().min(1).max(100) }).parse(params) },
  component: Page,
});
