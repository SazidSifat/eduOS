import { createFileRoute } from '@tanstack/react-router';
import { ExpenseSettings } from '../_component/expense-settings';

function Page() {
  return <ExpenseSettings />;
}

export const Route = createFileRoute('/_school/settings/expenses/')({
  component: Page,
});
