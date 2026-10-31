import { useState } from 'react';
import { DatePicker, Label } from '@eduos/ui';
import { useDemo } from '../../_component/demo-provider';
import { DEMO_TODAY, money } from '../../_component/school-format';
import {
  Choice,
  ExportButton,
  Metrics,
  Notice,
  PageHeading,
  Panel,
} from '../../_component/demo-ui';

export function ExpenseReport() {
  const { state } = useDemo();
  const [date, setDate] = useState(DEMO_TODAY);
  const [category, setCategory] = useState('All categories');
  const items = state.expenses.filter(
    (e) =>
      e.date.slice(0, 7) === date.slice(0, 7) &&
      (category === 'All categories' || e.category === category),
  );
  const total = items.reduce((sum, e) => sum + e.amount, 0);
  const paid = items.filter((e) => e.paid).reduce((sum, e) => sum + e.amount, 0);
  const approved = items
    .filter((e) => !e.paid && e.status === 'approved')
    .reduce((sum, e) => sum + e.amount, 0);
  const groups = state.categories
    .map((label) => ({
      label,
      amount: items.filter((e) => e.category === label).reduce((sum, e) => sum + e.amount, 0),
    }))
    .filter((g) => g.amount > 0)
    .sort((a, b) => b.amount - a.amount);
  const max = Math.max(...groups.map((g) => g.amount), 1);
  return (
    <>
      <PageHeading
        title="Expense report"
        description="Review school expenditure by category and reconcile actual payments."
        action={
          <ExportButton
            filename="school-expense-report"
            headers={['Category', 'Amount BDT']}
            rows={groups.map((g) => [g.label, g.amount / 100])}
          />
        }
      />
      <div className="demo-filters">
        <div>
          <Label htmlFor="expense-report-date">Month containing</Label>
          <DatePicker
            id="expense-report-date"
            value={date}
            onValueChange={(value) => {
              if (value) setDate(value);
            }}
          />
        </div>
        <Choice
          id="report-category"
          label="Category"
          value={category}
          options={['All categories', ...state.categories]}
          onChange={setCategory}
        />
      </div>
      <Metrics
        items={[
          {
            label: 'Recorded requests',
            value: money(total),
            detail: `${items.length} expense records`,
          },
          { label: 'Paid', value: money(paid), detail: 'Posted payment vouchers' },
          { label: 'Approved unpaid', value: money(approved), detail: 'Awaiting cash payment' },
          {
            label: 'Other unpaid requests',
            value: money(total - paid - approved),
            detail: 'Pending, returned or draft',
          },
        ]}
      />
      <Panel
        title="Spending by category"
        description="Category values reconcile to the selected period’s recorded expense total."
      >
        {groups.length ? (
          <dl className="demo-stack">
            {groups.map((group) => (
              <div
                key={group.label}
                className="grid gap-3 sm:grid-cols-[180px_minmax(0,1fr)_140px]"
              >
                <dt className="font-semibold">{group.label}</dt>
                <div className="self-center rounded bg-muted" aria-hidden="true">
                  <div
                    className="h-2 rounded bg-primary"
                    style={{ width: `${(group.amount / max) * 100}%` }}
                  />
                </div>
                <dd className="tabular-nums sm:text-right">
                  {money(group.amount)}
                  <span className="demo-help ml-3">
                    {total ? ((group.amount / total) * 100).toFixed(1) : 0}%
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="text-muted-foreground">
            No expense records match this period and category.
          </p>
        )}
      </Panel>
      <Notice title="Reporting basis">
        Recorded values include draft and pending requests. Paid totals include actual recorded
        vouchers. School expenses stay separate from student fee collections.
      </Notice>
    </>
  );
}
