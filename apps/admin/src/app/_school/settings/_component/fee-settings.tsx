import { useState } from 'react';
import { z } from 'zod';
import { Button } from '@eduos/ui';
import { useDemo } from '../../_component/demo-provider';
import { money } from '../../_component/school-format';
import { AdmissionFees, demoFeeSchema } from '../../admissions/_component/admission-fees';
import { DataTable, Notice, PageHeading, Panel, Status } from '../../_component/demo-ui';

export function FeeSettings() {
  const { state, dispatch, notify } = useDemo();
  const [fees, setFees] = useState(() => state.feeDefaults.map((f) => ({ ...f })));
  const [error, setError] = useState('');
  return (
    <>
      <PageHeading
        title="Fees and billing schedules"
        description="Configure future admission charges and monthly student schedules."
      />
      {error && (
        <Notice title="Review fee definitions" tone="danger">
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
          Save fee defaults
        </Button>
      </div>
      <Panel
        title="Student monthly schedules"
        description="Stopping a schedule prevents future billing. Existing charges and receipts remain in the account."
      >
        <DataTable
          caption="Student billing schedules"
          headers={['Student', 'Fee', 'Installment', 'Next charge', 'State', 'Action']}
        >
          {state.schedules.map((s) => (
            <tr key={s.id}>
              <td>{state.candidates.find((c) => c.id === s.candidateId)?.name}</td>
              <td>{s.label}</td>
              <td>{money(s.amount)}</td>
              <td>{s.next}</td>
              <td>
                <Status tone={s.active ? 'success' : 'neutral'}>
                  {s.active ? 'Active' : 'Stopped'}
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
                  Stop schedule
                </Button>
              </td>
            </tr>
          ))}
        </DataTable>
      </Panel>
      <Notice title="Charges do not collect money">
        The first installment can be collected at admission. A future monthly bill requires a
        separate cash payment. No automatic payment is taken.
      </Notice>
    </>
  );
}
