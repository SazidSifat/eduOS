import { config } from '../../../../lib/config';
import { schoolBase } from '../../_api/queries';
import { Link } from '@tanstack/react-router';
import { Button } from '@eduos/ui';
import { useDemo } from '../../_component/demo-provider';
import { money } from '../../_component/school-format';
import { DemoForm, valueOf } from '../../_component/demo-form';
import {
  DemoLink,
  Details,
  EmptyState,
  Notice,
  PageHeading,
  Panel,
  Status,
} from '../../_component/demo-ui';

export function ExpenseDetail({ id }: { id: string }) {
  const { state, snapshot, dispatch, notify } = useDemo();
  const expense = state.expenses.find((e) => e.id === id);
  if (!expense)
    return (
      <EmptyState
        title="Expense unavailable"
        action={<DemoLink to="/expenses">Open expense register</DemoLink>}
      >
        This expense is not in this school.
      </EmptyState>
    );
  return (
    <>
      <PageHeading
        title="Expense review"
        description={`${expense.id} · ${expense.description}`}
        action={<DemoLink to="/expenses">Back to register</DemoLink>}
      />
      <div className="demo-row-actions">
        <Status tone={expense.status === 'approved' ? 'success' : 'warning'}>
          {expense.status}
        </Status>
        <Status tone={expense.paid ? 'success' : 'neutral'}>
          {expense.paid ? 'Paid' : 'Not paid'}
        </Status>
      </div>
      <div className="demo-columns demo-columns-wide">
        <Panel title="Expense summary">
          <Details
            items={[
              ['Payee', expense.payee],
              ['Category', expense.category],
              ['Amount', money(expense.amount)],
              ['Expense date', expense.date],
              ['Reference', expense.reference || 'Not supplied'],
              ['Request history', 'See the audit entries below'],
              ['Payment state', expense.paid ? 'Paid' : 'Not paid'],
            ]}
          />
          {expense.notes && <p className="mt-6 text-muted-foreground">{expense.notes}</p>}
        </Panel>
        {expense.status === 'pending' ? (
          <fieldset
            disabled={!snapshot.permissions.includes('expenses.review')}
            className="min-w-0 border-0 p-0"
          >
            {!snapshot.permissions.includes('expenses.review') && (
              <p className="demo-help">An Admin or Principal must review this request.</p>
            )}
            <DemoForm
              sections={[
                {
                  title: 'Review decision',
                  description: 'Review the supporting evidence before authorizing this expense.',
                  fields: [
                    {
                      name: 'note',
                      label: 'Reviewer note',
                      kind: 'textarea',
                      wide: true,
                      required: true,
                      value: expense.reviewNote,
                    },
                  ],
                },
              ]}
              submitLabel="Approve expense"
              onSubmit={async (values) => {
                if (
                  !(await dispatch({
                    type: 'expense-review',
                    id,
                    approved: true,
                    note: valueOf(values, 'note'),
                  }))
                )
                  return;
                notify('Expense approved. An actual cash payment must still be recorded.');
              }}
              footer={
                <Button
                  onClick={async () => {
                    if (
                      !(await dispatch({
                        type: 'expense-review',
                        id,
                        approved: false,
                        note: 'Please review the amount and supporting evidence.',
                      }))
                    )
                      return;
                    notify('Expense returned for changes. No payment was recorded.');
                  }}
                  variant="outline"
                >
                  Return for changes
                </Button>
              }
            />
          </fieldset>
        ) : (
          <Panel
            title={
              expense.paid
                ? 'Payment recorded'
                : expense.status === 'approved'
                  ? 'Ready for payment'
                  : 'Request needs attention'
            }
          >
            {expense.reviewNote && (
              <p className="mb-5 text-muted-foreground">{expense.reviewNote}</p>
            )}
            {expense.status === 'approved' ? (
              <Button asChild>
                <Link to="/expenses/$expenseId/payment" params={{ expenseId: id }}>
                  {expense.paid ? 'View payment voucher' : 'Record actual payment'}
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="outline">
                  <Link to="/expenses/new" search={{ expense: id }}>
                    Edit request
                  </Link>
                </Button>
                <Button
                  className="mt-4"
                  onClick={async () => {
                    if (
                      !(await dispatch({
                        type: 'expense-save',
                        expense: {
                          ...expense,
                          status: 'pending',
                          history: [...expense.history, 'Request submitted for review.'],
                        },
                      }))
                    )
                      return;
                    notify('Expense submitted for review.');
                  }}
                >
                  Submit for review
                </Button>
              </>
            )}
          </Panel>
        )}
      </div>
      <Panel title="Supporting evidence">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-semibold">{expense.attachment || 'No attachment'}</p>
            <p className="demo-help mt-1">Stored supporting document · School access required</p>
          </div>
          {expense.attachment && (
            <Button asChild variant="outline">
              <a
                href={`${config.VITE_API_BASE_URL}${schoolBase(snapshot.institutionId)}/evidence/${encodeURIComponent(expense.attachment)}`}
              >
                Download evidence
              </a>
            </Button>
          )}
        </div>
      </Panel>
      <Panel title="Audit history">
        <ol className="demo-history">
          {expense.history.map((event, i) => (
            <li key={`${i}-${event}`}>
              <time>{expense.date}</time>
              <p>{event}</p>
            </li>
          ))}
        </ol>
      </Panel>
      <Notice title="Approval does not record a payment">
        The payment voucher confirms the actual money paid. Approved and paid records are protected
        from editing.
      </Notice>
    </>
  );
}
