import { useLanguage } from '@eduos/ui';
import { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { Button } from '@eduos/ui';
import { useDemo } from '../../_component/demo-provider';
import { DEMO_TODAY } from '../../_component/school-format';
import { DemoForm, valueOf } from '../../_component/demo-form';
import {
  DataTable,
  DemoLink,
  Details,
  EmptyState,
  Notice,
  PageHeading,
  Panel,
  Status,
} from '../../_component/demo-ui';
import type { Candidate } from '../../_component/demo-model';

export function CandidateDetail({ candidateId }: { candidateId: string }) {
  const { t, money } = useLanguage();

  const { state } = useDemo();
  const [closing, setClosing] = useState(false);
  const candidate = state.candidates.find((c) => c.id === candidateId);
  if (!candidate)
    return (
      <EmptyState
        title={t('Record unavailable')}
        action={<DemoLink to="/admissions">{t('Open admission directory')}</DemoLink>}
      >
        {t('This record is not available in your current school access.')}{' '}
      </EmptyState>
    );
  const schedules = state.schedules.filter((s) => s.candidateId === candidate.id);
  const receipts = state.payments.filter((p) => p.candidateId === candidate.id);
  return (
    <>
      <PageHeading
        title={candidate.state === 'admitted' ? t('Admission confirmed') : candidate.name}
        description={t('{value0} · {value1} · {value2} · Session {value3}', {
          value0: candidate.name,
          value1: candidate.id,
          value2: candidate.className,
          value3: candidate.session,
        })}
        action={
          candidate.state === 'admitted' ? (
            <DemoLink to="/admissions/admitted">{t('Admitted students')}</DemoLink>
          ) : (
            <Button asChild>
              <Link to="/admissions/new" search={{ mode: 'admitted', candidate: candidate.id }}>
                {t('Complete admission')}{' '}
              </Link>
            </Button>
          )
        }
      />
      {closing && <CloseCandidate candidateId={candidateId} done={() => setClosing(false)} />}
      <div className="demo-row-actions flex-wrap">
        <Status
          tone={
            candidate.state === 'admitted'
              ? 'success'
              : candidate.state === 'follow_up'
                ? 'warning'
                : 'neutral'
          }
        >
          {t(candidate.state)}
        </Status>
        {candidate.state !== 'admitted' && (
          <>
            <Button asChild variant="outline">
              <Link
                to="/admissions/new"
                search={{
                  mode: candidate.state === 'willing' ? 'willing' : 'follow_up',
                  candidate: candidate.id,
                }}
              >
                {t('Edit details')}{' '}
              </Link>
            </Button>
            {candidate.state === 'follow_up' && (
              <Button asChild variant="outline">
                <Link to="/admissions/new" search={{ mode: 'willing', candidate: candidate.id }}>
                  {t('Mark willing')}{' '}
                </Link>
              </Button>
            )}
            {candidate.state !== 'closed' && (
              <Button variant="ghost" onClick={() => setClosing(true)}>
                {t('Close record')}{' '}
              </Button>
            )}
          </>
        )}
      </div>
      {candidate.state === 'admitted' && (
        <Notice title={t('Student and enrollment created')} tone="success">
          {t('Admitted on')} {candidate.admittedOn}. Prospect reminders are cancelled. Future
          monthly charges require their own collection.
        </Notice>
      )}
      <div className="demo-columns demo-columns-wide">
        <div className="demo-stack">
          <Panel
            title={
              candidate.state === 'admitted' ? t('Student record') : t('Contact and assignment')
            }
          >
            <Details
              items={[
                ['Guardian', `${candidate.guardian} · ${candidate.relationship}`],
                ['Phone', candidate.phone],
                ['Address', candidate.address],
                ['Class / session', `${candidate.className} · ${candidate.session}`],
                [
                  'Admission Officer',
                  state.members.find((m) => m.id === candidate.officer)?.name ?? 'Unassigned',
                ],
                ...(candidate.state === 'follow_up'
                  ? [['Next call', candidate.nextCall] satisfies [string, string]]
                  : []),
              ]}
            />
          </Panel>
          <Panel
            title={t('Conversation history')}
            description={t('Newest first. Original notes stay in the same candidate record.')}
          >
            <ol className="demo-history">
              {candidate.calls.map((call, i) => (
                <li key={`${call.date}-${i}`}>
                  <time>{call.date}</time>
                  <p className="font-semibold">{t(call.outcome)}</p>
                  <p className="text-muted-foreground">{call.note}</p>
                </li>
              ))}
            </ol>
          </Panel>
        </div>
        <div className="demo-stack">
          {candidate.state === 'follow_up' ? (
            <CallEditor candidate={candidate} />
          ) : candidate.state === 'closed' ? (
            <ReopenRecord candidate={candidate} />
          ) : (
            <Panel
              title={candidate.state === 'admitted' ? t('Admission payment') : t('Willing fee')}
            >
              <Details
                items={[
                  ['Willing fee collected', money(candidate.willingPaid)],
                  ['Admission total', money(candidate.fees.reduce((sum, f) => sum + f.amount, 0))],
                  ['Recorded receipts', String(receipts.length)],
                ]}
              />
              <div className="demo-actions mt-5">
                {candidate.state === 'admitted' ? (
                  <Button asChild>
                    <Link to="/fees/$studentId" params={{ studentId: candidate.id }}>
                      {t('View fee account')}{' '}
                    </Link>
                  </Button>
                ) : candidate.willingPaid === 0 ? (
                  <Button asChild variant="outline">
                    <Link
                      to="/admissions/new"
                      search={{ mode: 'willing', candidate: candidate.id }}
                    >
                      {t('Optional willing collection')}{' '}
                    </Link>
                  </Button>
                ) : (
                  <Status tone="success">{t('Collected')}</Status>
                )}
              </div>
            </Panel>
          )}
        </div>
      </div>
      {!!receipts.length && (
        <Panel title={t('Receipts')}>
          <DataTable
            caption={t('Candidate payment receipts')}
            headers={['Receipt', 'Collected on', 'Kind', 'Cash received', 'Action']}
          >
            {receipts.map((p) => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td>{p.date}</td>
                <td>{t(p.kind)}</td>
                <td>{money(p.amount)}</td>
                <td>
                  <Link
                    className="demo-inline-link"
                    to="/fees/receipts/$receiptId"
                    params={{ receiptId: p.id }}
                  >
                    {t('View receipt')}{' '}
                  </Link>
                </td>
              </tr>
            ))}
          </DataTable>
        </Panel>
      )}
      {!!schedules.length && (
        <Panel
          title={t('Monthly billing schedules')}
          description={t(
            'Future bills are charges awaiting collection; no automatic payment is taken.',
          )}
        >
          <DataTable
            caption={t('Student monthly schedules')}
            headers={['Fee', 'Installment', 'Next bill', 'Ends', 'State']}
          >
            {schedules.map((s) => (
              <tr key={s.id}>
                <td>{t(s.label)}</td>
                <td>{money(s.amount)}</td>
                <td>{s.next}</td>
                <td>{s.end || t('No end date')}</td>
                <td>
                  <Status tone={s.active ? 'success' : 'neutral'}>
                    {s.active ? t('Active') : t('Stopped')}
                  </Status>
                </td>
              </tr>
            ))}
          </DataTable>
        </Panel>
      )}
    </>
  );
}
function CallEditor({ candidate }: { candidate: Candidate }) {
  const { t } = useLanguage();

  const { dispatch, notify } = useDemo();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  return (
    <>
      {error && (
        <Notice title={t('Review this call')} tone="danger">
          {error}
        </Notice>
      )}
      <DemoForm
        sections={[
          {
            title: 'Record a call',
            description:
              'Agreement opens the admission form; it does not confirm admission or payment.',
            fields: [
              {
                name: 'outcome',
                label: 'Outcome',
                required: true,
                value: 'Needs more time',
                options: ['Agreed', 'Needs more time', 'No answer', 'Not interested'],
              },
              { name: 'date', label: 'Next follow-up', kind: 'date', value: DEMO_TODAY },
              { name: 'note', label: 'Call notes', required: true, kind: 'textarea', wide: true },
            ],
          },
        ]}
        submitLabel={t('Save call')}
        onSubmit={async (values) => {
          const outcome = valueOf(values, 'outcome');
          const nextCall = valueOf(values, 'date');
          if (outcome !== 'Not interested' && !nextCall) {
            setError('Choose the next follow-up date.');
            return;
          }
          if (
            !(await dispatch({
              type: 'call',
              candidateId: candidate.id,
              outcome,
              nextCall,
              note: valueOf(values, 'note'),
            }))
          )
            return;
          notify('Call saved. The conversation history has been updated.');
          setError('');
          if (outcome === 'Agreed')
            void navigate({
              to: '/admissions/new',
              search: { mode: 'admitted', candidate: candidate.id },
            });
        }}
      />
    </>
  );
}
function ReopenRecord({ candidate }: { candidate: Candidate }) {
  const { t } = useLanguage();

  const { dispatch, notify } = useDemo();
  return (
    <DemoForm
      sections={[
        {
          title: 'Reopen as follow-up',
          description: 'Previous calls and the closure stay in history.',
          fields: [
            {
              name: 'date',
              label: 'Next follow-up',
              kind: 'date',
              required: true,
              value: DEMO_TODAY,
            },
            {
              name: 'reason',
              label: 'Reason for reopening',
              kind: 'textarea',
              required: true,
              wide: true,
            },
          ],
        },
      ]}
      submitLabel={t('Reopen follow-up')}
      onSubmit={async (values) => {
        const nextCall = valueOf(values, 'date');
        if (
          !(await dispatch({
            type: 'candidate-state',
            candidateId: candidate.id,
            state: 'follow_up',
            nextCall,
            note: valueOf(values, 'reason'),
          }))
        )
          return;
        notify('Follow-up reopened with a new date.');
      }}
    />
  );
}

function CloseCandidate({ candidateId, done }: { candidateId: string; done: () => void }) {
  const { t } = useLanguage();

  const { dispatch, notify } = useDemo();
  return (
    <DemoForm
      sections={[
        {
          title: 'Close admission record',
          fields: [
            { name: 'reason', label: 'Reason for closing', required: true, kind: 'textarea' },
          ],
        },
      ]}
      submitLabel={t('Confirm closure')}
      onSubmit={async (values) => {
        if (
          !(await dispatch({
            type: 'candidate-state',
            candidateId,
            state: 'closed',
            nextCall: '',
            note: valueOf(values, 'reason'),
          }))
        )
          return;
        notify('Record closed. Prospect reminders are cancelled.');
        done();
      }}
    />
  );
}
