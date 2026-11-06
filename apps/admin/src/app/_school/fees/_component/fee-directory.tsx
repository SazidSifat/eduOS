import { useLanguage } from '@eduos/ui';
import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Input, Label } from '@eduos/ui';
import { useDemo } from '../../_component/demo-provider';
import { DEMO_TODAY } from '../../_component/school-format';
import {
  DataTable,
  DemoLink,
  EmptyState,
  ExportButton,
  Metrics,
  PageHeading,
  Panel,
  Status,
} from '../../_component/demo-ui';

export function FeeDirectory({ dues = false }: { dues?: boolean }) {
  const { t, money } = useLanguage();

  const { state } = useDemo();
  const [search, setSearch] = useState('');
  const [overdue, setOverdue] = useState(false);
  const balance = (id: string) =>
    state.charges
      .filter((c) => c.candidateId === id)
      .reduce((sum, c) => sum + c.amount - c.paid, 0);
  const pastDue = (id: string) =>
    state.charges
      .filter((c) => c.candidateId === id && c.due < DEMO_TODAY)
      .reduce((sum, c) => sum + c.amount - c.paid, 0);
  const students = state.candidates.filter(
    (c) =>
      c.state === 'admitted' &&
      `${c.name} ${c.guardian} ${c.id} ${c.phone}`.toLowerCase().includes(search.toLowerCase()) &&
      (!dues || balance(c.id) > 0) &&
      (!overdue || pastDue(c.id) > 0),
  );
  const collected = state.payments.filter((p) => !p.reversed && p.date === DEMO_TODAY);
  return (
    <>
      <PageHeading
        title={dues ? t('Outstanding dues') : t('Collect a payment')}
        description={
          dues
            ? t('Review unpaid charges by student, class and due date.')
            : t('Find the student, review open charges and collect the actual cash received.')
        }
        action={
          dues ? (
            <ExportButton
              filename="school-dues"
              headers={['Student', 'Class', 'Balance BDT']}
              rows={students.map((c) => [c.name, c.className, balance(c.id) / 100])}
            />
          ) : (
            <DemoLink to="/fees/report">{t('Collection report')}</DemoLink>
          )
        }
      />
      <Metrics
        items={[
          {
            label: 'Collected today',
            value: money(collected.reduce((sum, p) => sum + p.amount, 0)),
            detail: t('{value0} cash receipts', { value0: collected.length }),
          },
          {
            label: 'Outstanding balance',
            value: money(state.charges.reduce((sum, c) => sum + c.amount - c.paid, 0)),
            detail: 'Open student charges',
          },
          {
            label: 'Overdue accounts',
            value: state.candidates.filter((c) => pastDue(c.id) > 0).length,
            detail: 'Past the charge due date',
          },
        ]}
      />
      <Panel
        title={dues ? t('Student balances') : t('Find a student')}
        description={t('Use a student name, record ID, guardian or contact number.')}
      >
        <div className="demo-filters mb-5">
          <div>
            <Label htmlFor="fee-search">{t('Search student')}</Label>
            <Input
              id="fee-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('Student name, record ID or guardian')}
            />
          </div>
          {dues && (
            <label className="demo-check">
              <input
                type="checkbox"
                checked={overdue}
                onChange={(e) => setOverdue(e.target.checked)}
              />
              {t('Overdue only')}{' '}
            </label>
          )}
        </div>
        {!students.length ? (
          <EmptyState title={t('No matching student accounts')}>
            {t('Try another name, or admit a student before collecting school fees.')}{' '}
          </EmptyState>
        ) : (
          <DataTable
            caption={t('Student fee accounts')}
            headers={['Student / ID', 'Class / session', 'Guardian', 'Outstanding', 'Action']}
          >
            {students.map((c) => (
              <tr key={c.id}>
                <td>
                  <strong>{c.name}</strong>
                  <small>{c.id}</small>
                </td>
                <td>
                  {c.className}
                  <small>{c.session}</small>
                </td>
                <td>
                  {c.guardian}
                  <small>{c.phone}</small>
                </td>
                <td>
                  {money(balance(c.id))}
                  {pastDue(c.id) > 0 && <small>{money(pastDue(c.id))} overdue</small>}
                </td>
                <td>
                  <Link
                    to="/fees/$studentId"
                    params={{ studentId: c.id }}
                    className="demo-inline-link"
                  >
                    {t('Open account')}{' '}
                  </Link>
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </Panel>
      {!dues && (
        <Panel title={t('Recent collections')}>
          {state.payments.length ? (
            <DataTable
              caption={t('Recent cash receipts')}
              headers={['Receipt', 'Student', 'Collected on', 'Amount', 'State']}
            >
              {state.payments
                .slice(-5)
                .reverse()
                .map((p) => (
                  <tr key={p.id}>
                    <td>
                      <Link
                        to="/fees/receipts/$receiptId"
                        params={{ receiptId: p.id }}
                        className="demo-inline-link"
                      >
                        {p.id}
                      </Link>
                    </td>
                    <td>{state.candidates.find((c) => c.id === p.candidateId)?.name}</td>
                    <td>{p.date}</td>
                    <td>{money(p.amount)}</td>
                    <td>
                      <Status tone={p.reversed ? 'danger' : 'success'}>
                        {p.reversed ? t('Reversed') : t('Posted')}
                      </Status>
                    </td>
                  </tr>
                ))}
            </DataTable>
          ) : (
            <EmptyState title={t('No collections recorded yet')}>
              {t('Choose a student and collect a payment to create the first receipt.')}{' '}
            </EmptyState>
          )}
        </Panel>
      )}
    </>
  );
}
