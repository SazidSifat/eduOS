import { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { z } from 'zod';
import { Button, Switch, Textarea, Label } from '@eduos/ui';
import { useDemo } from '../../_component/demo-provider';
import { DEMO_TODAY, money } from '../../_component/demo-data';
import { admissionTotal } from '../../_component/demo-finance';
import type { Candidate, CandidateState, FeeItem } from '../../_component/demo-model';
import { DemoForm, valueOf, type FormSection } from '../../_component/demo-form';
import { Notice, PageHeading, Panel } from '../../_component/demo-ui';
import { AdmissionFees, demoFeeSchema } from './admission-fees';

export function CandidateForm({
  mode,
  candidateId,
}: {
  mode: Exclude<CandidateState, 'closed'>;
  candidateId: string;
}) {
  const { state, dispatch, notify } = useDemo();
  const navigate = useNavigate();
  const candidate = state.candidates.find((c) => c.id === candidateId);
  const [fees, setFees] = useState<FeeItem[]>(() =>
    (candidate?.fees ?? state.feeDefaults).map((f) => ({ ...f })),
  );
  const [collectWilling, setCollectWilling] = useState(false);
  const [cash, setCash] = useState(false);
  const [exception, setException] = useState(!!candidate?.exceptionReason);
  const [exceptionReason, setExceptionReason] = useState(candidate?.exceptionReason ?? '');
  const [error, setError] = useState('');
  const full = mode !== 'follow_up';
  const credit = state.settings.creditWilling === 'yes' ? (candidate?.willingPaid ?? 0) : 0;
  const due = admissionTotal(fees) - Math.min(admissionTotal(fees), credit);
  const willingAmount = Math.round(Number(state.settings.willingFee ?? '500') * 100);
  const sections: FormSection[] = [
    {
      title: full ? 'Student information' : 'Student and guardian',
      description: 'All examples in this workspace are synthetic. Fields marked * are required.',
      fields: [
        { name: 'name', label: 'Student name', required: true, value: candidate?.name ?? '' },
        {
          name: 'className',
          label: 'Class / section',
          required: true,
          value: candidate?.className ?? 'Class 3 · A',
          options: [
            ...new Set([
              ...state.offerings
                .filter((o) => o.active)
                .flatMap((o) =>
                  o.sections.split(',').map((section) => `${o.className} · ${section.trim()}`),
                ),
              ...(candidate ? [candidate.className] : []),
            ]),
          ],
        },
        {
          name: 'session',
          label: 'Academic session',
          required: true,
          value: candidate?.session ?? '2026',
          options: ['2026', '2027'],
        },
        {
          name: 'dob',
          label: 'Date of birth',
          kind: 'date',
          required: full,
          value: candidate?.dob ?? '',
        },
        {
          name: 'guardian',
          label: 'Primary guardian',
          required: true,
          value: candidate?.guardian ?? '',
        },
        {
          name: 'phone',
          label: 'Guardian phone',
          required: true,
          value: candidate?.phone ?? '',
          helper: 'Use a synthetic example such as 01XXX XXX 201.',
        },
        {
          name: 'relationship',
          label: 'Relationship',
          value: candidate?.relationship ?? 'Mother',
          options: ['Mother', 'Father', 'Guardian'],
        },
        {
          name: 'address',
          label: 'Residential address',
          required: full,
          value: candidate?.address ?? '',
        },
        {
          name: 'source',
          label: 'Lead source',
          value: candidate?.source ?? 'School visit',
          options: ['School visit', 'Open day', 'Referral', 'Phone enquiry'],
        },
      ],
    },
  ];
  if (full)
    sections.push({
      title: 'Parents and identity',
      fields: [
        { name: 'father', label: 'Father’s name', required: true, value: candidate?.father ?? '' },
        { name: 'mother', label: 'Mother’s name', required: true, value: candidate?.mother ?? '' },
        {
          name: 'nationality',
          label: 'Nationality',
          required: true,
          value: candidate?.nationality ?? 'Bangladeshi',
        },
        {
          name: 'certificate',
          label: 'Birth certificate reference',
          required: !exception,
          value: candidate?.certificate ?? '',
          helper: 'Use a synthetic reference only.',
        },
        {
          name: 'nid',
          label: 'Guardian NID reference',
          required: !exception,
          value: candidate?.nid ?? '',
          helper: 'Use a synthetic reference only.',
        },
        {
          name: 'previousSchool',
          label: 'Previous school (optional)',
          value: candidate?.previousSchool ?? '',
        },
      ],
    });
  sections.push({
    title: mode === 'follow_up' ? 'Next conversation' : 'Assignment and notes',
    fields: [
      {
        name: 'officer',
        label: 'Admission Officer',
        required: true,
        value: candidate?.officer ?? 'Nusrat Ahmed',
        options: ['Nusrat Ahmed', 'Sadia Karim'],
      },
      ...(mode === 'follow_up'
        ? [
            {
              name: 'nextCall',
              label: 'Next follow-up date',
              required: true,
              kind: 'date' as const,
              value: candidate?.nextCall ?? '2026-10-28',
            },
          ]
        : []),
      {
        name: 'notes',
        label: 'Notes',
        kind: 'textarea',
        wide: true,
        value: candidate?.notes ?? '',
      },
    ],
  });
  function submit(values: Record<string, string>) {
    setError('');
    if (candidate?.state === 'admitted') {
      setError('This candidate is already admitted. Open the existing student record.');
      return;
    }
    if (exception && !exceptionReason.trim()) {
      setError('Record the reason for the missing-document exception.');
      return;
    }
    const parsedFees = z.array(demoFeeSchema).min(1).safeParse(fees);
    if (mode === 'admitted' && !parsedFees.success) {
      setError(parsedFees.error.issues[0]?.message ?? 'Review the fee items.');
      return;
    }
    if (((mode === 'admitted' && due > 0) || (mode === 'willing' && collectWilling)) && !cash) {
      setError('Confirm the actual cash received before saving.');
      return;
    }
    if (mode === 'willing' && collectWilling && willingAmount <= 0) {
      setError('Configure a positive willing fee in Admissions settings.');
      return;
    }
    const read = (key: string) => valueOf(values, key).trim();
    const record: Candidate = {
      id: candidate?.id ?? `ADM-2026-${128 + state.candidates.length}`,
      name: read('name'),
      guardian: read('guardian'),
      phone: read('phone'),
      className: read('className'),
      session: read('session'),
      officer: read('officer'),
      state: mode === 'admitted' ? (candidate?.state ?? 'willing') : mode,
      nextCall: mode === 'follow_up' ? read('nextCall') : '',
      notes: read('notes'),
      dob: read('dob'),
      father: read('father'),
      mother: read('mother'),
      address: read('address'),
      certificate: read('certificate'),
      nid: read('nid'),
      relationship: read('relationship'),
      nationality: read('nationality'),
      previousSchool: read('previousSchool'),
      source: read('source'),
      exceptionReason: exception ? exceptionReason : '',
      willingPaid: candidate?.willingPaid ?? 0,
      admittedOn: '',
      calls: candidate?.calls ?? [
        { date: DEMO_TODAY, outcome: 'Record created', note: 'Created in the frontend demo.' },
      ],
      fees,
    };
    dispatch({ type: 'candidate-save', candidate: record });
    if (mode === 'admitted')
      dispatch({ type: 'admit', candidateId: record.id, fees, cashConfirmed: cash });
    if (mode === 'willing' && collectWilling)
      dispatch({ type: 'willing-payment', candidateId: record.id, amount: willingAmount });
    notify(
      mode === 'admitted'
        ? 'Admission and selected cash payment recorded in demo data.'
        : 'Admission record saved in demo data.',
    );
    void navigate({ to: '/admissions/$candidateId', params: { candidateId: record.id } });
  }
  return (
    <>
      <PageHeading
        title={
          mode === 'admitted'
            ? 'Complete admission'
            : mode === 'willing'
              ? 'New willing student'
              : 'New follow-up'
        }
        description={
          candidate
            ? `${candidate.name} · Details are prefilled from the same candidate record.`
            : 'Start with the right intake stage. The student’s history carries forward.'
        }
      />
      <nav className="demo-tabs" aria-label="Record stage">
        {(['follow_up', 'willing', 'admitted'] as const).map((stage) => (
          <Link
            key={stage}
            to="/admissions/new"
            search={{ mode: stage, candidate: candidateId }}
            aria-current={mode === stage ? 'page' : undefined}
          >
            {stage === 'follow_up'
              ? 'Follow-up'
              : stage === 'willing'
                ? 'Willing student'
                : 'Direct admission'}
          </Link>
        ))}
      </nav>
      {error && (
        <Notice title="Review this admission" tone="danger">
          {error}
        </Notice>
      )}
      <DemoForm
        sections={sections}
        onSubmit={submit}
        submitLabel={
          mode === 'admitted'
            ? 'Confirm admission & payment'
            : mode === 'willing'
              ? 'Save willing student'
              : 'Save follow-up'
        }
        footer={
          <Button asChild variant="outline">
            <Link to="/admissions">Cancel</Link>
          </Button>
        }
      >
        {full && (
          <Panel title="Missing-document exception">
            <div className="demo-check">
              <Switch id="document-exception" checked={exception} onCheckedChange={setException} />
              <Label htmlFor="document-exception">Record an Admin / Principal exception</Label>
            </div>
            {exception && (
              <div className="demo-field mt-4">
                <Label htmlFor="exception-reason">Exception reason</Label>
                <Textarea
                  id="exception-reason"
                  value={exceptionReason}
                  onChange={(e) => setExceptionReason(e.target.value)}
                />
              </div>
            )}
          </Panel>
        )}
        {mode === 'admitted' && (
          <AdmissionFees
            fees={fees}
            credit={credit}
            onChange={(value) => {
              setFees(value);
              setCash(false);
            }}
          />
        )}
        {mode === 'willing' && (
          <Panel
            title="Optional willing fee"
            description="Skipping collection creates no willing charge, receipt or outstanding balance."
          >
            <div className="demo-check">
              <Switch
                id="collect-willing"
                checked={collectWilling}
                onCheckedChange={(value) => {
                  setCollectWilling(value);
                  setCash(false);
                }}
              />
              <Label htmlFor="collect-willing">
                Collect willing fee now · {money(willingAmount)}
              </Label>
            </div>
            <p className="demo-help mt-3">
              {state.settings.creditWilling === 'yes'
                ? 'This fee will be credited toward admission.'
                : 'This fee is separate from admission.'}{' '}
              No prospect reminders are scheduled for willing records.
            </p>
          </Panel>
        )}
        {((mode === 'admitted' && due > 0) || (mode === 'willing' && collectWilling)) && (
          <Notice title="Actual cash received" tone="success">
            <label className="demo-check">
              <input type="checkbox" checked={cash} onChange={(e) => setCash(e.target.checked)} />I
              have collected {money(mode === 'admitted' ? due : willingAmount)} in cash.
            </label>
          </Notice>
        )}
      </DemoForm>
    </>
  );
}
