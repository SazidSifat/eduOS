import { createFileRoute } from '@tanstack/react-router';
import { ExpenseDirectory } from './_component/expense-directory';

function Page() {
  return <ExpenseDirectory />;
}

export const Route = createFileRoute('/_school/expenses/')({
  component: Page,
});
