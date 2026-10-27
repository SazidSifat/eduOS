import { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { Button } from '@eduos/ui';
import { useDemo } from '../../_component/demo-provider';
import { money } from '../../_component/demo-data';
import { receiptId } from '../../_component/demo-finance';
import {
  DataTable,
  DemoLink,
  Details,
  EmptyState,
  Notice,
  PageHeading,
  Panel,
} from '../../_component/demo-ui';

export function PaymentReview({ studentId }: { studentId: string }) {
  const { state, dispatch, feeDraft, setFeeDraft, notify } = useDemo();
  const navigate = useNavigate();
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState('');
  const candidate = state.candidates.find((c) => c.id === studentId);
  if (!candidate || !feeDraft || feeDraft.candidateId !== studentId)
    return (
      <EmptyState
        title="No payment to review"
        action={<DemoLink to="/fees">Choose a student</DemoLink>}
      >
        Select the charges in a student fee account before reviewing a collection.
      </EmptyState>
    );
  const total = feeDraft.allocations.reduce((sum, a) => sum + a.amount, 0);
  const balance = state.charges
    .filter((c) => c.candidateId === studentId)
    .reduce((sum, c) => sum + c.amount - c.paid, 0);
  function collect() {
    if (!feeDraft || !confirmed) {
      setError('Confirm the actual cash received before posting this payment.');
      return;
    }
    if (
      feeDraft.allocations.some((a) => {
        const c = state.charges.find((c) => c.id === a.chargeId);
        return !c || a.amount > c.amount - c.paid;
      })
    ) {
      setError('A charge balance changed. Return to the account and review the allocation.');
      return;
    }
    const id = receiptId(state);
    dispatch({
      type: 'collect',
      candidateId: studentId,
      allocations: feeDraft.allocations,
      date: feeDraft.date,
    });
    setFeeDraft(null);
    notify('Cash payment and allocations recorded. Your receipt is ready.');
    void navigate({ to: '/fees/receipts/$receiptId', params: { receiptId: id } });
  }
  return (
    <>
      <PageHeading
        title="Review payment"
        description="Check the student, allocations and cash amount before issuing a receipt."
      />
      {error && (
        <Notice title="Payment not posted" tone="danger">
          {error}
        </Notice>
      )}
      <Panel
        title={`Payment for ${candidate.name}`}
        description={`${candidate.id} · ${candidate.className} · Guardian: ${candidate.guardian}`}
      >
        <DataTable
          caption="Payment allocation review"
          headers={['Charge', 'Period', 'Cash allocation']}
        >
          {feeDraft.allocations.map((a) => {
            const charge = state.charges.find((c) => c.id === a.chargeId);
            return (
              <tr key={a.chargeId}>
                <td>{charge?.label}</td>
                <td>{charge?.period}</td>
                <td>{money(a.amount)}</td>
              </tr>
            );
          })}
        </DataTable>
        <div className="mt-6">
          <Details
            items={[
              ['Total cash received', money(total)],
              ['Method', 'Cash'],
              ['Collection date', feeDraft.date],
              ['Collected by', 'Nusrat Ahmed'],
              ['Remaining balance', money(balance - total)],
            ]}
          />
        </div>
        {feeDraft.note && <p className="mt-5 text-muted-foreground">Note: {feeDraft.note}</p>}
      </Panel>
      <Notice title="Cash receipt confirmation" tone="success">
        <label className="demo-check">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
          />
          I have received {money(total)} in cash from this student’s guardian.
        </label>
      </Notice>
      <div className="demo-actions">
        <Button asChild variant="outline">
          <Link to="/fees/$studentId" params={{ studentId }}>
            Back to allocation
          </Link>
        </Button>
        <Button onClick={collect}>Confirm cash & issue receipt</Button>
      </div>
    </>
  );
}
