import { useLanguage } from '@eduos/ui';
import { useState } from 'react';
import { z } from 'zod';
import { Button } from '@eduos/ui';
import { useDemo } from '../../_component/demo-provider';

import { AdmissionFees, demoFeeSchema } from '../../admissions/_component/admission-fees';
import { DataTable, Notice, PageHeading, Panel, Status } from '../../_component/demo-ui';

export function FeeSettings() {
  const { t, money } = useLanguage();

  const { state, dispatch, notify } = useDemo();
  const [fees, setFees] = useState(() => state.feeDefaults.map((f) => ({ ...f })));
  const [error, setError] = useState('');
  return (
    <>
      <PageHeading
        title={t('Fees and billing schedules')}
        description={t('Configure future admission charges and monthly student schedules.')}
      />
      {error && (
        <Notice title={t('Review fee definitions')} tone="danger">
          {error}
        </Notice>
      )}
      <AdmissionFees fees={fees} onChange={setFees} credit={0} />
      <div className="demo-actions">
        <Button
          onClick={async () => {
            const parsed = z.array(demoFeeSchema).min(1).safeParse(fees);
            if (!parsed.success) {
              setError(parsed.error.issues[0]?.message ?? 'Review fees.');
              return;
            }
            if (!(await dispatch({ type: 'fee-defaults', fees }))) return;
            setError('');
            notify(
              'Fee defaults saved. New admissions use these items; existing charges and receipts retain their values.',
            );
          }}
        >
          {t('Save fee defaults')}{' '}
        </Button>
      </div>
      <Panel
        title={t('Student monthly schedules')}
        description={t(
          'Stopping a schedule prevents future billing. Existing charges and receipts remain in the account.',
        )}
      >
        <DataTable
          caption={t('Student billing schedules')}
          headers={['Student', 'Fee', 'Installment', 'Next charge', 'State', 'Action']}
        >
          {state.schedules.map((s) => (
            <tr key={s.id}>
              <td>{state.candidates.find((c) => c.id === s.candidateId)?.name}</td>
              <td>{t(s.label)}</td>
              <td>{money(s.amount)}</td>
              <td>{s.next}</td>
              <td>
                <Status tone={s.active ? 'success' : 'neutral'}>
                  {s.active ? t('Active') : t('Stopped')}
                </Status>
              </td>
              <td>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!s.active}
                  onClick={async () => {
                    if (!(await dispatch({ type: 'schedule-stop', id: s.id }))) return;
                    notify('Future billing stopped. Existing financial records are unchanged.');
                  }}
                >
                  {t('Stop schedule')}{' '}
                </Button>
              </td>
            </tr>
          ))}
        </DataTable>
      </Panel>
      <Notice title={t('Charges do not collect money')}>
        {t(
          'The first installment can be collected at admission. A future monthly bill requires a separate cash payment. No automatic payment is taken.',
        )}{' '}
      </Notice>
    </>
  );
}
