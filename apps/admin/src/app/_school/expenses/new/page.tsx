import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { ExpenseForm } from '../_component/expense-form';

function Page() {
  const search = Route.useSearch();
  return <ExpenseForm key={search.expense ?? 'new'} expenseId={search.expense ?? ''} />;
}

export const Route = createFileRoute('/_school/expenses/new/')({
  validateSearch: (search: Record<string, unknown>) =>
    z.object({ expense: z.string().max(100).optional().catch(undefined) }).parse(search),
  component: Page,
});
