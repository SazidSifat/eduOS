import { useLanguage } from '@eduos/ui';
import { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { z } from 'zod';
import { Input } from '@eduos/ui';
import { useDemo } from '../../_component/demo-provider';
import { DEMO_TODAY } from '../../_component/school-format';
import { DemoForm, valueOf } from '../../_component/demo-form';
import {
  DataTable,
  DemoLink,
  Details,
  EmptyState,
  Metrics,
  Notice,
  PageHeading,
  Panel,
} from '../../_component/demo-ui';

export function StudentAccount({ studentId }: { studentId: string }) {
  const { t, money } = useLanguage();

  const { state, setFeeDraft } = useDemo();
  const navigate = useNavigate();
  const candidate = state.candidates.find((c) => c.id === studentId && c.state === 'admitted');
  const charges = state.charges.filter((c) => c.candidateId === studentId && c.amount > c.paid);
  const [selected, setSelected] = useState<Record<string, number>>(() =>
    Object.fromEntries(charges.slice(0, 2).map((c) => [c.id, c.amount - c.paid])),
  );
  const [error, setError] = useState('');
  if (!candidate)
    return (
      <EmptyState
        title={t('Student account unavailable')}
        action={<DemoLink to="/fees">{t('Find a student')}</DemoLink>}
      >
        {t('Only admitted students have a school fee account in this school.')}{' '}
      </EmptyState>
    );
  const balance = charges.reduce((sum, c) => sum + c.amount - c.paid, 0);
  const total = Object.values(selected).reduce(
    (sum, amount) => sum + (Number.isFinite(amount) ? amount : 0),
    0,
  );
  return (
    <>
      <PageHeading
        title={candidate.name}
        description={t('{value0} · {value1} · Session {value2}', {
          value0: candidate.id,
          value1: candidate.className,
          value2: candidate.session,
        })}
        action={<DemoLink to="/fees">{t('Back to search')}</DemoLink>}
      />
      <Panel title={t('Student fee account')}>
        <Details
          items={[
            ['Guardian', `${candidate.guardian} · ${candidate.phone}`],
            ['Enrollment', t('Active · {value0}', { value0: candidate.className })],
          ]}
        />
      </Panel>
      <Metrics
        items={[
          {
            label: 'Open charges',
            value: money(balance),
            detail: t('{value0} unpaid items', { value0: charges.length }),
          },
          {
            label: 'Selected to collect',
            value: money(total),
            detail: t('{value0} charge items', { value0: Object.keys(selected).length }),
          },
          {
            label: 'Balance after payment',
            value: money(Math.max(0, balance - total)),
            detail: 'Unselected balance remains open',
          },
        ]}
      />
      {error && (
        <Notice title={t('Review the allocation')} tone="danger">
          {error}
        </Notice>
      )}
      <Panel
        title={t('Select charges to collect')}
        description={t(
          'Allocate cash to particular charges. Amounts can be smaller than the outstanding balance.',
        )}
      >
        {!charges.length ? (
          <EmptyState title={t('No outstanding charges')}>
            {t('This student’s current school charges are fully paid.')}{' '}
          </EmptyState>
        ) : (
          <DataTable
            caption={t('Select student fee charges')}
            headers={['Collect', 'Fee / period', 'Due date', 'Balance', 'Allocate (BDT)']}
          >
            {charges.map((c) => (
              <tr key={c.id}>
                <td>
                  <input
                    type="checkbox"
                    className="size-4 accent-primary"
                    aria-label={t('Select {value0}', { value0: c.label })}
                    checked={Object.hasOwn(selected, c.id)}
                    onChange={(e) =>
                      setSelected((current) => {
                        const next = { ...current };
                        if (e.target.checked) next[c.id] = c.amount - c.paid;
                        else delete next[c.id];
                        return next;
                      })
                    }
                  />
                </td>
                <td>
                  <strong>{t(c.label)}</strong>
                  <small>{c.period}</small>
                </td>
                <td>{c.due}</td>
                <td>{money(c.amount - c.paid)}</td>
                <td>
                  <Input
                    aria-label={t('Allocate {value0} in BDT', { value0: c.label })}
                    className="w-32"
                    type="number"
                    step="0.01"
                    min="0"
                    max={(c.amount - c.paid) / 100}
                    disabled={!Object.hasOwn(selected, c.id)}
                    value={
                      Object.hasOwn(selected, c.id)
                        ? Number.isFinite(selected[c.id])
                          ? (selected[c.id] ?? 0) / 100
                          : ''
                        : ''
                    }
                    onChange={(e) =>
                      setSelected((current) => ({
                        ...current,
                        [c.id]: e.target.value ? Math.round(Number(e.target.value) * 100) : NaN,
                      }))
                    }
                  />
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </Panel>
      {!!charges.length && (
        <DemoForm
          sections={[
            {
              title: 'Cash collection',
              description:
                'Review the selected amount before confirming the physical cash received.',
              fields: [
                { name: 'method', label: 'Payment method', value: 'Cash', readOnly: true },
                {
                  name: 'date',
                  label: 'Collection date',
                  kind: 'date',
                  value: DEMO_TODAY,
                  required: true,
                },
                { name: 'note', label: 'Collection note (optional)', kind: 'textarea', wide: true },
              ],
            },
          ]}
          submitLabel={t('Review payment · {value0}', { value0: money(total) })}
          footer={<DemoLink to="/fees">{t('Cancel')}</DemoLink>}
          onSubmit={(values) => {
            const allocations = Object.entries(selected).map(([chargeId, amount]) => ({
              chargeId,
              amount,
            }));
            const parsed = z
              .array(z.object({ chargeId: z.string(), amount: z.number().int().positive() }))
              .min(1)
              .safeParse(allocations);
            if (
              !parsed.success ||
              allocations.some((a) => {
                const charge = charges.find((c) => c.id === a.chargeId);
                return !charge || a.amount > charge.amount - charge.paid;
              })
            ) {
              setError(
                'Select at least one positive allocation that does not exceed its charge balance.',
              );
              return;
            }
            setFeeDraft({
              candidateId: studentId,
              allocations,
              date: valueOf(values, 'date'),
              note: valueOf(values, 'note'),
            });
            void navigate({ to: '/fees/$studentId/review', params: { studentId } });
          }}
        />
      )}
      <Panel title={t('Payment history')}>
        {state.payments.filter((p) => p.candidateId === studentId).length ? (
          <ul className="demo-history">
            {state.payments
              .filter((p) => p.candidateId === studentId)
              .map((p) => (
                <li key={p.id}>
                  <Link
                    className="demo-inline-link"
                    to="/fees/receipts/$receiptId"
                    params={{ receiptId: p.id }}
                  >
                    {p.id} · {money(p.amount)}
                  </Link>
                  <p className="demo-help">
                    {p.date}
                    {t('· Cash ·')}
                    {p.reversed ? t('Reversed') : t('Posted')}
                  </p>
                </li>
              ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">
            {t('No payments have been recorded for this student.')}
          </p>
        )}
      </Panel>
    </>
  );
}
