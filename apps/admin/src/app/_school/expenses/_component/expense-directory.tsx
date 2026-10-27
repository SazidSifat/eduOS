import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Input, Label } from '@eduos/ui';
import { useDemo } from '../../_component/demo-provider';
import { money } from '../../_component/demo-data';
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

export function ExpenseDirectory() {
  const { state } = useDemo();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All categories');
  const [status, setStatus] = useState('All states');
  const [payment, setPayment] = useState('All payments');
  const items = state.expenses.filter(
    (e) =>
      `${e.id} ${e.description} ${e.payee}`.toLowerCase().includes(search.toLowerCase()) &&
      (category === 'All categories' || e.category === category) &&
      (status === 'All states' || e.status === status) &&
      (payment === 'All payments' || (payment === 'Paid' ? e.paid : !e.paid)),
  );
  const sum = (predicate: (expense: (typeof state.expenses)[number]) => boolean) =>
    state.expenses.filter(predicate).reduce((total, expense) => total + expense.amount, 0);
  return (
    <>
      <PageHeading
        title="Expense register"
        description="Track school spending from request to approval and actual payment."
        action={
          <DemoLink to="/expenses/new" primary>
            Record expense
          </DemoLink>
        }
      />
      <Metrics
        items={[
          {
            label: 'Recorded expenses',
            value: money(sum(() => true)),
            detail: `${state.expenses.length} records`,
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
          <Label htmlFor="expense-search">Find an expense</Label>
          <Input
            id="expense-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Reference, description or payee"
          />
        </div>
        <Choice
          id="expense-category"
          label="Category"
          value={category}
          options={['All categories', ...state.categories]}
          onChange={setCategory}
        />
        <Choice
          id="expense-state"
          label="Approval"
          value={status}
          options={['All states', 'draft', 'pending', 'approved', 'returned']}
          onChange={setStatus}
        />
        <Choice
          id="expense-payment"
          label="Payment"
          value={payment}
          options={['All payments', 'Paid', 'Unpaid']}
          onChange={setPayment}
        />
      </div>
      {!items.length ? (
        <EmptyState title="No matching expenses">
          Try another category, payment state or search term.
        </EmptyState>
      ) : (
        <DataTable
          caption="School expense register"
          headers={['Expense / payee', 'Category', 'Amount', 'Approval', 'Payment', 'Action']}
        >
          {items.map((e) => (
            <tr key={e.id}>
              <td>
                <strong>{e.id}</strong>
                <small>
                  {e.description} · {e.payee}
                </small>
              </td>
              <td>{e.category}</td>
              <td>{money(e.amount)}</td>
              <td>
                <Status
                  tone={
                    e.status === 'approved'
                      ? 'success'
                      : e.status === 'pending'
                        ? 'warning'
                        : 'neutral'
                  }
                >
                  {e.status}
                </Status>
              </td>
              <td>
                <Status tone={e.paid ? 'success' : 'neutral'}>
                  {e.paid ? 'Paid' : 'Not paid'}
                </Status>
              </td>
              <td>
                <Link
                  className="demo-inline-link"
                  to="/expenses/$expenseId"
                  params={{ expenseId: e.id }}
                >
                  Open expense
                </Link>
              </td>
            </tr>
          ))}
        </DataTable>
      )}
      <div className="demo-actions">
        <ExportButton
          filename="school-expenses-demo"
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
        <DemoLink to="/expenses/report">Expense report</DemoLink>
      </div>
      <Notice title="Approval and payment are separate">
        Approval authorizes the expense. A voucher records the actual cash paid, with the original
        request and history retained.
      </Notice>
    </>
  );
}
