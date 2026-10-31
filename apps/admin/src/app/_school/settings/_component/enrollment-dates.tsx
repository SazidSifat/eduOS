import { useState } from 'react';
import type { SchoolSnapshot } from '@eduos/contracts';
import { useDemo } from '../../_component/demo-provider';
import { DemoForm, valueOf } from '../../_component/demo-form';
import { Choice, Notice } from '../../_component/demo-ui';
import { queryClient } from '../../../../lib/query-client';
import { enrollmentHistoryKey } from '../_api/enrollment-history';
import { EnrollmentDateHistory } from './enrollment-date-history';

export function EnrollmentDates() {
  const { snapshot } = useDemo();
  const [selected, setSelected] = useState('');
  if (!snapshot.permissions.includes('academics.manage') || !snapshot.modules.includes('academics'))
    return null;
  const student =
    snapshot.students.find((s) => s.enrollmentId === selected) ?? snapshot.students[0];
  const labels = Object.fromEntries(
    snapshot.students.map((s) => [
      s.enrollmentId,
      `${s.name} · ${snapshot.classes.find((c) => c.id === s.classId)?.label ?? 'Archived class'} · Roll ${s.roll}`,
    ]),
  );
  return (
    <section className="demo-stack" aria-labelledby="enrollment-dates-heading">
      <h2 id="enrollment-dates-heading" className="font-semibold">
        Enrollment dates
      </h2>
      <p className="demo-help">
        Record verified dates for the selected enrollment. Both dates include that day. Leave
        unknown dates blank; submitted attendance is preserved.
      </p>
      {!student ? (
        <p>No enrolled students are available. Confirm an admission before recording dates.</p>
      ) : (
        <>
          <Choice
            id="enrollment-student"
            label="Student enrollment"
            value={student.enrollmentId}
            options={snapshot.students.map((s) => s.enrollmentId)}
            optionLabels={labels}
            onChange={setSelected}
          />
          <EnrollmentDateEditor key={student.enrollmentId} student={student} />
        </>
      )}
    </section>
  );
}

function EnrollmentDateEditor({ student }: { student: SchoolSnapshot['students'][number] }) {
  const { snapshot, dispatch, notify, busy } = useDemo();
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(0);
  return (
    <>
      {error && (
        <Notice title="Review enrollment dates" tone="danger">
          {error}
        </Notice>
      )}
      <DemoForm
        key={`${student.startsOn}:${student.endsOn}:${saved}`}
        busy={busy}
        sections={[
          {
            title: 'Effective enrollment period',
            fields: [
              {
                name: 'startsOn',
                label: 'Enrollment start',
                kind: 'date',
                value: student.startsOn ?? '',
                helper: 'Blank means the start date is unknown.',
              },
              {
                name: 'endsOn',
                label: 'Enrollment end',
                kind: 'date',
                value: student.endsOn ?? '',
                helper: 'Blank means the end date is unknown.',
              },
              {
                name: 'reason',
                label: 'Reason for date change',
                kind: 'textarea',
                required: true,
                wide: true,
              },
            ],
          },
        ]}
        submitLabel="Save enrollment dates"
        onSubmit={async (values) => {
          const startsOn = valueOf(values, 'startsOn') || null;
          const endsOn = valueOf(values, 'endsOn') || null;
          if (startsOn && endsOn && startsOn > endsOn) {
            setError('The enrollment end must be on or after its start.');
            return;
          }
          setError('');
          if (
            !(await dispatch({
              type: 'enrollment-dates',
              enrollmentId: student.enrollmentId,
              startsOn,
              endsOn,
              reason: valueOf(values, 'reason').trim(),
            }))
          )
            return;
          await queryClient.invalidateQueries({
            queryKey: enrollmentHistoryKey(
              snapshot.identity.id,
              snapshot.institutionId,
              student.enrollmentId,
            ),
          });
          setSaved((value) => value + 1);
          notify('Enrollment dates saved. Attendance uses the verified period.');
        }}
      />
      <EnrollmentDateHistory enrollmentId={student.enrollmentId} />
    </>
  );
}
