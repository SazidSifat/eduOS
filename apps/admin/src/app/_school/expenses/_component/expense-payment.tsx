import { useLanguage } from '@eduos/ui';
import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Button } from '@eduos/ui';
import { Printer } from 'lucide-react';
import { useDemo } from '../../_component/demo-provider';
import { DEMO_TODAY } from '../../_component/school-format';
import {
  DemoLink,
  Details,
  EmptyState,
  Notice,
  PageHeading,
  Panel,
} from '../../_component/demo-ui';

export function ExpensePayment({ id }: { id: string }) {
  const { t, money } = useLanguage();

  const { state, dispatch, notify } = useDemo();
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState('');
  const expense = state.expenses.find((e) => e.id === id);
  if (!expense)
    return (
      <EmptyState
        title={t('Expense unavailable')}
        action={<DemoLink to="/expenses">{t('Open expense register')}</DemoLink>}
      >
        {t('Choose an approved expense before recording payment.')}{' '}
      </EmptyState>
    );
  return (
    <>
      <div className="demo-print-hide">
        <PageHeading
          title={t('Payment voucher')}
          description={`${expense.id} · ${expense.description}`}
          action={
            expense.paid ? (
              <Button variant="outline" onClick={() => window.print()}>
                <Printer size={16} />
                {t('Print voucher')}{' '}
              </Button>
            ) : (
              <DemoLink to="/expenses">{t('Expense register')}</DemoLink>
            )
          }
        />
      </div>
      <Notice
        title={
          expense.paid
            ? t('Paid · {value0}', { value0: expense.voucher })
            : expense.status === 'approved'
              ? t('Approved · Awaiting payment')
              : t('Approval required')
        }
        tone={expense.paid ? 'success' : 'warning'}
      >
        {expense.paid
          ? t('The actual cash payment has been recorded in the school ledger.')
          : t('Record payment only after the approved cash amount has actually been paid.')}
      </Notice>
      <Panel
        title={state.settings.name ?? t('School')}
        description={t('School expense payment voucher')}
        className="demo-receipt"
      >
        <Details
          items={[
            ['Expense reference', expense.id],
            ['Payee', expense.payee],
            ['Description', expense.description],
            ['Approved amount', money(expense.amount)],
            ['Payment method', 'Cash'],
            ['Payment date', expense.paid ? (expense.paidOn ?? 'See audit history') : DEMO_TODAY],
            ['Recorded by', expense.paidBy || 'Assigned cashier'],
            ['Voucher', expense.voucher || 'Created after payment confirmation'],
          ]}
        />
      </Panel>
      {error && (
        <Notice title={t('Payment not recorded')} tone="danger">
          {error}
        </Notice>
      )}
      {!expense.paid && expense.status === 'approved' && (
        <>
          <Notice title={t('Cash payment confirmation')} tone="success">
            <label className="demo-check">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
              />
              {t('I have paid')} {money(expense.amount)} to {expense.payee}.
            </label>
          </Notice>
          <div className="demo-actions">
            <Button asChild variant="outline">
              <Link to="/expenses/$expenseId" params={{ expenseId: id }}>
                {t('Back to review')}{' '}
              </Link>
            </Button>
            <Button
              onClick={async () => {
                if (!confirmed) {
                  setError('Confirm the actual cash paid before recording this voucher.');
                  return;
                }
                if (!(await dispatch({ type: 'expense-pay', id }))) return;
                setError('');
                notify(
                  'Cash payment recorded. The original expense and voucher remain in history.',
                );
              }}
            >
              {t('Confirm payment')}{' '}
            </Button>
          </div>
        </>
      )}
      {expense.paid && (
        <div className="demo-actions demo-print-hide">
          <DemoLink to="/expenses">{t('Back to expenses')}</DemoLink>
        </div>
      )}
    </>
  );
}
