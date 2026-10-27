import { createFileRoute } from '@tanstack/react-router';
import { ExpenseReport } from '../_component/expense-report';

function Page() {
  return <ExpenseReport />;
}

export const Route = createFileRoute('/_school/expenses/report/')({
  component: Page,
});
