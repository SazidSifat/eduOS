import { useLanguage } from '@eduos/ui';
import { Link } from '@tanstack/react-router';
import { Button } from '@eduos/ui';
import { Printer } from 'lucide-react';
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

export function ReceiptPage({ id }: { id: string }) {
  const { t, money } = useLanguage();

  const { state } = useDemo();
  const payment = state.payments.find((p) => p.id === id);
  const student = state.candidates.find((c) => c.id === payment?.candidateId);
  if (!payment || !student)
    return (
      <EmptyState
        title={t('Receipt unavailable')}
        action={<DemoLink to="/fees">{t('Collect a payment')}</DemoLink>}
      >
        {t(
          'Create a cash collection to view its receipt. Receipts remain available after reloading.',
        )}{' '}
      </EmptyState>
    );
  const balance = state.charges
    .filter((c) => c.candidateId === student.id)
    .reduce((sum, c) => sum + c.amount - c.paid, 0);
  return (
    <>
      <div className="demo-print-hide">
        <PageHeading
          title={payment.reversed ? t('Receipt reversed') : t('Payment recorded')}
          description={t('The saved cash receipt remains visible in the payment history.')}
          action={
            <Button variant="outline" onClick={() => window.print()}>
              <Printer size={16} aria-hidden="true" />
              {t('Print receipt')}{' '}
            </Button>
          }
        />
      </div>
      <Notice
        title={
          payment.reversed
            ? t('This receipt has been reversed')
            : t('{value0} collected successfully', { value0: money(payment.amount) })
        }
        tone={payment.reversed ? 'danger' : 'success'}
      >
        {payment.reversed ||
          t('{value0} · {value1} · Cash', { value0: payment.id, value1: payment.date })}
      </Notice>
      <Panel
        title={state.settings.name ?? t('School')}
        description={t('{value0} · Institution {value1}', {
          value0: state.settings.address ?? '',
          value1: state.settings.code,
        })}
        className="demo-receipt"
      >
        <p className="mb-6 font-semibold text-primary">
          {t('CASH RECEIPT ·')}
          {payment.id}
        </p>
        <Details
          items={[
            ['Student', `${student.name} · ${student.id}`],
            ['Class / session', `${student.className} · ${student.session}`],
            ['Guardian', student.guardian],
            ['Collected on', payment.date],
          ]}
        />
        <div className="my-6">
          <DataTable caption={t('Receipt items')} headers={['Fee description', 'Period', 'Amount']}>
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
          {t(
            'Keep the receipt number for future enquiries. Posted entries remain in history after authorized reversal.',
          )}{' '}
        </p>
      </Panel>
      <div className="demo-actions demo-print-hide">
        <Button asChild variant="outline">
          <Link to="/fees/$studentId" params={{ studentId: student.id }}>
            {t('View student account')}{' '}
          </Link>
        </Button>
        <DemoLink to="/fees" primary>
          {t('Collect another payment')}{' '}
        </DemoLink>
      </div>
    </>
  );
}
