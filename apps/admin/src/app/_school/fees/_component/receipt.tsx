import { Link } from '@tanstack/react-router';
import { Button } from '@eduos/ui';
import { Printer } from 'lucide-react';
import { useDemo } from '../../_component/demo-provider';
import { money } from '../../_component/school-format';
import {
  DataTable,
  DemoLink,
  Details,
  EmptyState,
  Notice,
  PageHeading,
  Panel,
} from '../../_component/demo-ui';

export function ReceiptPage({ id }: { id: string }) {
  const { state } = useDemo();
  const payment = state.payments.find((p) => p.id === id);
  const student = state.candidates.find((c) => c.id === payment?.candidateId);
  if (!payment || !student)
    return (
      <EmptyState
        title="Receipt unavailable"
        action={<DemoLink to="/fees">Collect a payment</DemoLink>}
      >
        Create a cash collection to view its receipt. Receipts remain available after reloading.
      </EmptyState>
    );
  const balance = state.charges
    .filter((c) => c.candidateId === student.id)
    .reduce((sum, c) => sum + c.amount - c.paid, 0);
  return (
    <>
      <div className="demo-print-hide">
        <PageHeading
          title={payment.reversed ? 'Receipt reversed' : 'Payment recorded'}
          description="The saved cash receipt remains visible in the payment history."
          action={
            <Button variant="outline" onClick={() => window.print()}>
              <Printer size={16} aria-hidden="true" />
              Print receipt
            </Button>
          }
        />
      </div>
      <Notice
        title={
          payment.reversed
            ? 'This receipt has been reversed'
            : `${money(payment.amount)} collected successfully`
        }
        tone={payment.reversed ? 'danger' : 'success'}
      >
        {payment.reversed || `${payment.id} · ${payment.date} · Cash`}
      </Notice>
      <Panel
        title={state.settings.name ?? 'School'}
        description={`${state.settings.address ?? ''} · Institution ${state.settings.code}`}
        className="demo-receipt"
      >
        <p className="mb-6 font-semibold text-primary">CASH RECEIPT · {payment.id}</p>
        <Details
          items={[
            ['Student', `${student.name} · ${student.id}`],
            ['Class / session', `${student.className} · ${student.session}`],
            ['Guardian', student.guardian],
            ['Collected on', payment.date],
          ]}
        />
        <div className="my-6">
          <DataTable caption="Receipt items" headers={['Fee description', 'Period', 'Amount']}>
            {payment.allocations.map((a) => {
              const c = state.charges.find((c) => c.id === a.chargeId);
              return (
                <tr key={a.chargeId}>
                  <td>{c?.label ?? payment.kind}</td>
                  <td>{c?.period}</td>
                  <td>{money(a.amount)}</td>
                </tr>
              );
            })}
          </DataTable>
        </div>
        <Details
          items={[
            ['Total received', money(payment.amount)],
            ['Method', 'Cash'],
            ['Collected by', payment.collector],
            ['Current account balance', money(balance)],
          ]}
        />
        <p className="demo-help mt-6">
          Keep the receipt number for future enquiries. Posted entries remain in history after
          authorized reversal.
        </p>
      </Panel>
      <div className="demo-actions demo-print-hide">
        <Button asChild variant="outline">
          <Link to="/fees/$studentId" params={{ studentId: student.id }}>
            View student account
          </Link>
        </Button>
        <DemoLink to="/fees" primary>
          Collect another payment
        </DemoLink>
      </div>
    </>
  );
}
