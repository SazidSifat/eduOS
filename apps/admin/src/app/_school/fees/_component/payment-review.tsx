import { useLanguage } from '@eduos/ui';
import { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { Button } from '@eduos/ui';
import { useDemo } from '../../_component/demo-provider';

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
  const { t, money } = useLanguage();

  const { state, snapshot, dispatch, feeDraft, setFeeDraft, notify } = useDemo();
  const navigate = useNavigate();
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState('');
  const candidate = state.candidates.find((c) => c.id === studentId);
  if (!candidate || !feeDraft || feeDraft.candidateId !== studentId)
    return (
      <EmptyState
        title={t('No payment to review')}
        action={<DemoLink to="/fees">{t('Choose a student')}</DemoLink>}
      >
        {t('Select the charges in a student fee account before reviewing a collection.')}{' '}
      </EmptyState>
    );
  const total = feeDraft.allocations.reduce((sum, a) => sum + a.amount, 0);
  const balance = state.charges
    .filter((c) => c.candidateId === studentId)
    .reduce((sum, c) => sum + c.amount - c.paid, 0);
  async function collect() {
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
    const saved = await dispatch({
      type: 'collect',
      candidateId: studentId,
      allocations: feeDraft.allocations,
      date: feeDraft.date,
    });
    if (!saved?.id) return;
    setFeeDraft(null);
    notify('Cash payment and allocations recorded. Your receipt is ready.');
    void navigate({ to: '/fees/receipts/$receiptId', params: { receiptId: saved.id } });
  }
  return (
    <>
      <PageHeading
        title={t('Review payment')}
        description={t('Check the student, allocations and cash amount before issuing a receipt.')}
      />
      {error && (
        <Notice title={t('Payment not posted')} tone="danger">
          {error}
        </Notice>
      )}
      <Panel
        title={t('Payment for {value0}', { value0: candidate.name })}
        description={t('{value0} · {value1} · Guardian: {value2}', {
          value0: candidate.id,
          value1: candidate.className,
          value2: candidate.guardian,
        })}
      >
        <DataTable
          caption={t('Payment allocation review')}
          headers={['Charge', 'Period', 'Cash allocation']}
        >
          {feeDraft.allocations.map((a) => {
            const charge = state.charges.find((c) => c.id === a.chargeId);
            return (
              <tr key={a.chargeId}>
                <td>{t(charge?.label)}</td>
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
              ['Collected by', snapshot.identity.name],
              ['Remaining balance', money(balance - total)],
            ]}
          />
        </div>
        {feeDraft.note && (
          <p className="mt-5 text-muted-foreground">
            {t('Note:')} {feeDraft.note}
          </p>
        )}
      </Panel>
      <Notice title={t('Cash receipt confirmation')} tone="success">
        <label className="demo-check">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
          />
          {t('I have received')} {money(total)} {t('in cash from this student’s guardian.')}{' '}
        </label>
      </Notice>
      <div className="demo-actions">
        <Button asChild variant="outline">
          <Link to="/fees/$studentId" params={{ studentId }}>
            {t('Back to allocation')}{' '}
          </Link>
        </Button>
        <Button onClick={collect}>{t('Confirm cash & issue receipt')}</Button>
      </div>
    </>
  );
}
