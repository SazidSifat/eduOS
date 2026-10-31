import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Button, DatePicker, Label } from '@eduos/ui';
import { useDemo } from '../../_component/demo-provider';
import { DEMO_TODAY, money } from '../../_component/school-format';
import { DemoForm, valueOf } from '../../_component/demo-form';
import {
  DataTable,
  EmptyState,
  ExportButton,
  Metrics,
  Notice,
  PageHeading,
  Panel,
  Status,
} from '../../_component/demo-ui';

export function CollectionReport() {
  const { state, snapshot, dispatch, notify } = useDemo();
  const [date, setDate] = useState(DEMO_TODAY);
  const [reverseId, setReverseId] = useState('');
  const payments = state.payments.filter((p) => p.date === date);
  const gross = payments.reduce((sum, p) => sum + p.amount, 0);
  const reversed = payments.filter((p) => p.reversed).reduce((sum, p) => sum + p.amount, 0);
  return (
    <>
      <PageHeading
        title="Collection report"
        description="Posted payments and reversals with accountable collector totals."
        action={
          <ExportButton
            filename="school-collections"
            headers={['Receipt', 'Student', 'Date', 'Amount BDT', 'State']}
            rows={payments.map((p) => [
              p.id,
              state.candidates.find((c) => c.id === p.candidateId)?.name ?? '',
              p.date,
              p.amount / 100,
              p.reversed ? 'Reversed' : 'Posted',
            ])}
          />
        }
      />
      <div className="demo-filters">
        <div>
          <Label htmlFor="collection-date">Collection date</Label>
          <DatePicker
            id="collection-date"
            value={date}
            onValueChange={(value) => {
              if (value) setDate(value);
            }}
          />
        </div>
      </div>
      <Metrics
        items={[
          { label: 'Gross receipts', value: money(gross), detail: `${payments.length} receipts` },
          {
            label: 'Reversals',
            value: money(reversed),
            detail: `${payments.filter((p) => p.reversed).length} reversed receipts`,
          },
          {
            label: 'Net collection',
            value: money(gross - reversed),
            detail: 'Gross less reversals',
          },
        ]}
      />
      <Panel title="Collector summary">
        <DataTable
          caption="Collector totals"
          headers={['Collector', 'Receipts', 'Gross', 'Reversed', 'Net']}
        >
          {[...new Set(payments.map((p) => p.collector))].map((collector) => {
            const rows = payments.filter((p) => p.collector === collector);
            const total = rows.reduce((s, p) => s + p.amount, 0);
            const reversedTotal = rows.filter((p) => p.reversed).reduce((s, p) => s + p.amount, 0);
            return (
              <tr key={collector}>
                <td>{collector}</td>
                <td>{rows.length}</td>
                <td>{money(total)}</td>
                <td>{money(reversedTotal)}</td>
                <td>{money(total - reversedTotal)}</td>
              </tr>
            );
          })}
        </DataTable>
      </Panel>
      <Panel
        title="Collection ledger"
        description="Historical receipts remain visible after reversal."
      >
        {!payments.length ? (
          <EmptyState title="No collections on this date">
            Collect a student fee or choose another collection date.
          </EmptyState>
        ) : (
          <DataTable
            caption="School collection ledger"
            headers={['Receipt / student', 'Method', 'Amount', 'State', 'Action']}
          >
            {payments.map((p) => (
              <tr key={p.id}>
                <td>
                  <Link
                    to="/fees/receipts/$receiptId"
                    params={{ receiptId: p.id }}
                    className="demo-inline-link"
                  >
                    {p.id}
                  </Link>
                  <small>{state.candidates.find((c) => c.id === p.candidateId)?.name}</small>
                </td>
                <td>Cash</td>
                <td>{money(p.amount)}</td>
                <td>
                  <Status tone={p.reversed ? 'danger' : 'success'}>
                    {p.reversed ? 'Reversed' : 'Posted'}
                  </Status>
                </td>
                <td>
                  {p.kind === 'school' &&
                  !p.reversed &&
                  snapshot.permissions.includes('fees.reverse') &&
                  /^[0-9a-f-]{36}$/.test(p.id) ? (
                    <Button size="sm" variant="outline" onClick={() => setReverseId(p.id)}>
                      Reverse receipt
                    </Button>
                  ) : (
                    <span className="demo-help">
                      {p.reversed ? p.reversed : 'Admission receipt'}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </Panel>
      {reverseId && (
        <DemoForm
          key={reverseId}
          sections={[
            {
              title: `Reverse ${reverseId}`,
              description:
                'The original receipt remains in the ledger. Its allocations return to the student’s open balance.',
              fields: [
                {
                  name: 'reason',
                  label: 'Reversal reason',
                  kind: 'textarea',
                  required: true,
                  wide: true,
                },
              ],
            },
          ]}
          submitLabel="Confirm authorized reversal"
          footer={
            <Button variant="outline" onClick={() => setReverseId('')}>
              Cancel
            </Button>
          }
          onSubmit={async (values) => {
            if (
              !(await dispatch({
                type: 'reverse',
                paymentId: reverseId,
                reason: valueOf(values, 'reason'),
              }))
            )
              return;
            setReverseId('');
            notify(
              'Receipt reversed. The original record is retained and its charges are open again.',
            );
          }}
        />
      )}
      <Notice title="School fees and subscriptions are separate">
        These are student fee collections. Institution subscriptions and operating expenses have
        their own records.
      </Notice>
    </>
  );
}
