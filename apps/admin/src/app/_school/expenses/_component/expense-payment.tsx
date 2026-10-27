import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Button } from '@eduos/ui';
import { Printer } from 'lucide-react';
import { useDemo } from '../../_component/demo-provider';
import { DEMO_TODAY, money } from '../../_component/demo-data';
import {
  DemoLink,
  Details,
  EmptyState,
  Notice,
  PageHeading,
  Panel,
} from '../../_component/demo-ui';

export function ExpensePayment({ id }: { id: string }) {
  const { state, dispatch, notify } = useDemo();
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState('');
  const expense = state.expenses.find((e) => e.id === id);
  if (!expense)
    return (
      <EmptyState
        title="Expense unavailable"
        action={<DemoLink to="/expenses">Open expense register</DemoLink>}
      >
        Choose an approved expense before recording payment.
      </EmptyState>
    );
  return (
    <>
      <div className="demo-print-hide">
        <PageHeading
          title="Payment voucher"
          description={`${expense.id} · ${expense.description}`}
          action={
            expense.paid ? (
              <Button variant="outline" onClick={() => window.print()}>
                <Printer size={16} />
                Print voucher
              </Button>
            ) : (
              <DemoLink to="/expenses">Expense register</DemoLink>
            )
          }
        />
      </div>
      <Notice
        title={
          expense.paid
            ? `Paid · ${expense.voucher}`
            : expense.status === 'approved'
              ? 'Approved · Awaiting payment'
              : 'Approval required'
        }
        tone={expense.paid ? 'success' : 'warning'}
      >
        {expense.paid
          ? 'The actual cash payment has been recorded in the synthetic ledger.'
          : 'Record payment only after the approved cash amount has actually been paid.'}
      </Notice>
      <Panel
        title={state.settings.name ?? 'Shapla Model School'}
        description="School expense payment voucher"
        className="demo-receipt"
      >
        <Details
          items={[
            ['Expense reference', expense.id],
            ['Payee', expense.payee],
            ['Description', expense.description],
            ['Approved amount', money(expense.amount)],
            ['Payment method', 'Cash'],
            ['Payment date', DEMO_TODAY],
            ['Recorded by', 'Nusrat Ahmed'],
            ['Voucher', expense.voucher || 'Created after payment confirmation'],
          ]}
        />
      </Panel>
      {error && (
        <Notice title="Payment not recorded" tone="danger">
          {error}
        </Notice>
      )}
      {!expense.paid && expense.status === 'approved' && (
        <>
          <Notice title="Cash payment confirmation" tone="success">
            <label className="demo-check">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
              />
              I have paid {money(expense.amount)} to {expense.payee}.
            </label>
          </Notice>
          <div className="demo-actions">
            <Button asChild variant="outline">
              <Link to="/expenses/$expenseId" params={{ expenseId: id }}>
                Back to review
              </Link>
            </Button>
            <Button
              onClick={() => {
                if (!confirmed) {
                  setError('Confirm the actual cash paid before recording this voucher.');
                  return;
                }
                dispatch({ type: 'expense-pay', id });
                setError('');
                notify(
                  'Cash payment recorded. The original expense and voucher remain in history.',
                );
              }}
            >
              Confirm payment
            </Button>
          </div>
        </>
      )}
      {expense.paid && (
        <div className="demo-actions demo-print-hide">
          <DemoLink to="/expenses">Back to expenses</DemoLink>
        </div>
      )}
    </>
  );
}
