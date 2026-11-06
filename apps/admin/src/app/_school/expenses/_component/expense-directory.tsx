import { useLanguage } from '@eduos/ui';
import { Link } from '@tanstack/react-router';
import { Input, Label } from '@eduos/ui';
import { useDemo } from '../../_component/demo-provider';

import {
  Choice,
  DataTable,
  DemoLink,
  EmptyState,
  ExportButton,
  Metrics,
  Notice,
  PageHeading,
  Status,
} from '../../_component/demo-ui';
import { useSchoolUiStore } from '../../../../stores/school-ui-store';

export function ExpenseDirectory() {
  const { t, money } = useLanguage();

  const { state } = useDemo();
  const { expenseFilter, setExpenseFilter } = useSchoolUiStore();

  const items = state.expenses.filter(
    (e) =>
      `${e.id} ${e.description} ${e.payee}`
        .toLowerCase()
        .includes(expenseFilter.search.toLowerCase()) &&
      (expenseFilter.category === 'All categories' || e.category === expenseFilter.category) &&
      (expenseFilter.status === 'All states' || e.status === expenseFilter.status) &&
      (expenseFilter.payment === 'All payments' ||
        (expenseFilter.payment === 'Paid' ? e.paid : !e.paid)),
  );

  const sum = (predicate: (expense: (typeof state.expenses)[number]) => boolean) =>
    state.expenses.filter(predicate).reduce((total, expense) => total + expense.amount, 0);

  return (
    <>
      <PageHeading
        title={t('Expense register')}
        description={t('Track school spending from request to approval and actual payment.')}
        action={
          <DemoLink to="/expenses/new" primary>
            {t('Record expense')}{' '}
          </DemoLink>
        }
      />
      <Metrics
        items={[
          {
            label: 'Recorded expenses',
            value: money(sum(() => true)),
            detail: t('{value0} records', { value0: state.expenses.length }),
          },
          { label: 'Paid', value: money(sum((e) => e.paid)), detail: 'Posted payment vouchers' },
          {
            label: 'Approved · unpaid',
            value: money(sum((e) => e.status === 'approved' && !e.paid)),
            detail: 'Ready for payment',
          },
          {
            label: 'Awaiting approval',
            value: money(sum((e) => e.status === 'pending')),
            detail: 'Review queue',
          },
        ]}
      />
      <div className="demo-filters">
        <div>
          <Label htmlFor="expense-search">{t('Search expenses')}</Label>
          <Input
            id="expense-search"
            value={expenseFilter.search}
            onChange={(e) => setExpenseFilter({ search: e.target.value })}
            placeholder={t('Reference, description or payee')}
          />
        </div>
        <Choice
          id="expense-category"
          label={t('Category')}
          value={expenseFilter.category}
          options={['All categories', ...state.categories]}
          onChange={(category) => setExpenseFilter({ category })}
        />
        <Choice
          id="expense-state"
          label={t('Approval')}
          value={expenseFilter.status}
          options={['All states', 'draft', 'pending', 'approved', 'returned']}
          onChange={(status) => setExpenseFilter({ status })}
        />
        <Choice
          id="expense-payment"
          label={t('Payment status')}
          value={expenseFilter.payment}
          options={['All payments', 'Paid', 'Unpaid']}
          onChange={(payment) => setExpenseFilter({ payment })}
        />
      </div>
      {!items.length ? (
        <EmptyState title={t('No matching expenses')}>
          {t('Try another category, payment state or search term.')}{' '}
        </EmptyState>
      ) : (
        <DataTable
          caption={t('School expense register')}
          headers={['Expense / payee', 'Category', 'Amount (BDT)', 'Approval', 'Payment', 'Action']}
        >
          {items.map((e) => (
            <tr key={e.id}>
              <td>
                <p className="font-semibold">{e.id}</p>
                <small className="text-muted-foreground">
                  {t(e.description)} · {e.payee}
                </small>
              </td>
              <td>{e.category}</td>
              <td className="font-medium">{money(e.amount)}</td>
              <td>
                <Status
                  tone={
                    e.status === 'approved'
                      ? 'success'
                      : e.status === 'pending'
                        ? 'warning'
                        : e.status === 'returned'
                          ? 'danger'
                          : 'neutral'
                  }
                >
                  {t(e.status)}
                </Status>
              </td>
              <td>
                <Status tone={e.paid ? 'success' : e.status === 'approved' ? 'warning' : 'neutral'}>
                  {e.paid ? t('Paid') : t('Unpaid')}
                </Status>
              </td>
              <td>
                {e.paid ? (
                  <Link
                    className="demo-inline-link"
                    to="/expenses/$expenseId/payment"
                    params={{ expenseId: e.id }}
                  >
                    {t('Voucher')}{' '}
                  </Link>
                ) : e.status === 'pending' ? (
                  <Link
                    className="demo-inline-link"
                    to="/expenses/$expenseId"
                    params={{ expenseId: e.id }}
                  >
                    {t('Review')}{' '}
                  </Link>
                ) : (
                  <Link
                    className="demo-inline-link"
                    to="/expenses/$expenseId"
                    params={{ expenseId: e.id }}
                  >
                    {t('Open')}{' '}
                  </Link>
                )}
              </td>
            </tr>
          ))}
        </DataTable>
      )}
      <div className="demo-actions">
        <ExportButton
          filename="school-expenses"
          headers={['Reference', 'Description', 'Category', 'Amount BDT', 'Approval', 'Paid']}
          rows={items.map((e) => [
            e.id,
            e.description,
            e.category,
            e.amount / 100,
            e.status,
            e.paid ? 'Yes' : 'No',
          ])}
        />
        <DemoLink to="/expenses/report">{t('Expense report')}</DemoLink>
      </div>
      <Notice title={t('Every posted payment has a voucher')} tone="info">
        {t(
          'Approval authorizes spending. Payment records the actual money paid; these are separate actions.',
        )}{' '}
      </Notice>
    </>
  );
}
