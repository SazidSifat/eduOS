import { useState } from 'react';
import { Button } from '@eduos/ui';
import { z } from 'zod';
import { useDemo } from '../../_component/demo-provider';
import { roster } from '../../_component/demo-data';
import { DemoForm, valueOf } from '../../_component/demo-form';
import {
  Choice,
  DataTable,
  EmptyState,
  Notice,
  PageHeading,
  Status,
} from '../../_component/demo-ui';

export function AttendanceCorrections() {
  const { state, dispatch, notify } = useDemo();
  const submitted = state.registers.filter((r) => r.submitted);
  const [registerId, setRegisterId] = useState(
    () =>
      submitted.find((r) => r.date === '2026-10-25' && r.classId === '3-a')?.id ??
      submitted[0]?.id ??
      '',
  );
  const [error, setError] = useState('');
  const register = submitted.find((r) => r.id === registerId);
  const options = register
    ? roster(register.classId).map((s) => `${s.name} · ${register.marks[s.id]}`)
    : [];
  return (
    <>
      <PageHeading
        title="Attendance corrections"
        description="Request and review a correction while preserving the original submission."
      />
      <Notice title="Original attendance is retained">
        A request records the original status, proposed status and reason. An authorized school
        reviewer approves or rejects it. The demo shows both sides of the workflow.
      </Notice>
      {error && (
        <Notice title="Correction not sent" tone="danger">
          {error}
        </Notice>
      )}
      {!register ? (
        <EmptyState title="No submitted registers">
          Submit a daily register before requesting a correction.
        </EmptyState>
      ) : (
        <>
          <div className="demo-filters">
            <Choice
              id="correction-register"
              label="Submitted class register"
              value={registerId}
              options={submitted.map((r) => r.id)}
              onChange={setRegisterId}
            />
          </div>
          <DemoForm
            key={registerId}
            sections={[
              {
                title: 'Request correction',
                description: `${register.classId.toUpperCase()} · ${register.date} · Original submission`,
                fields: [
                  {
                    name: 'student',
                    label: 'Student / original status',
                    required: true,
                    options,
                    value: options.find((o) => o.endsWith('Absent')) ?? options[0] ?? '',
                  },
                  {
                    name: 'proposed',
                    label: 'Proposed status',
                    required: true,
                    options: ['Present', 'Absent', 'Late'],
                    value: 'Present',
                  },
                  {
                    name: 'reason',
                    label: 'Correction reason',
                    required: true,
                    kind: 'textarea',
                    wide: true,
                  },
                ],
              },
            ]}
            submitLabel="Send correction request"
            onSubmit={(values) => {
              const student = roster(register.classId).find(
                (s) => `${s.name} · ${register.marks[s.id]}` === valueOf(values, 'student'),
              );
              const proposed = z
                .enum(['Present', 'Absent', 'Late'])
                .safeParse(valueOf(values, 'proposed'));
              const original = student ? register.marks[student.id] : undefined;
              if (!student || !proposed.success || !original || proposed.data === original) {
                setError('Choose a student and a status different from the original submission.');
                return;
              }
              if (
                state.corrections.some(
                  (c) =>
                    c.registerId === register.id &&
                    c.studentId === student.id &&
                    c.status === 'pending',
                )
              ) {
                setError('This student already has a pending correction for the register.');
                return;
              }
              dispatch({
                type: 'correction-request',
                correction: {
                  id: `COR-${state.corrections.length + 1}`,
                  registerId: register.id,
                  studentId: student.id,
                  original,
                  proposed: proposed.data,
                  reason: valueOf(values, 'reason'),
                  status: 'pending',
                },
              });
              setError('');
              notify('Correction sent for school review. The original register is unchanged.');
            }}
          />
        </>
      )}
      <DataTable
        caption="Attendance correction audit history"
        headers={['Student / register', 'Original', 'Proposed', 'Reason', 'Decision', 'Review']}
      >
        {state.corrections.length ? (
          state.corrections.map((c) => {
            const r = state.registers.find((r) => r.id === c.registerId);
            return (
              <tr key={c.id}>
                <td>
                  {roster(r?.classId ?? '3-a').find((s) => s.id === c.studentId)?.name}
                  <small>
                    {r?.date} · {r?.classId}
                  </small>
                </td>
                <td>{c.original}</td>
                <td>{c.proposed}</td>
                <td className="max-w-72 whitespace-normal">{c.reason}</td>
                <td>
                  <Status
                    tone={
                      c.status === 'approved'
                        ? 'success'
                        : c.status === 'pending'
                          ? 'warning'
                          : 'danger'
                    }
                  >
                    {c.status}
                  </Status>
                </td>
                <td>
                  {c.status === 'pending' ? (
                    <div className="demo-row-actions">
                      <Button
                        size="sm"
                        onClick={() => {
                          dispatch({ type: 'correction-review', id: c.id, approved: true });
                          notify(
                            'Correction approved. The original status is retained in this audit record.',
                          );
                        }}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          dispatch({ type: 'correction-review', id: c.id, approved: false })
                        }
                      >
                        Reject
                      </Button>
                    </div>
                  ) : (
                    'Reviewed'
                  )}
                </td>
              </tr>
            );
          })
        ) : (
          <tr>
            <td colSpan={6}>No correction requests yet. New requests appear here for review.</td>
          </tr>
        )}
      </DataTable>
    </>
  );
}
