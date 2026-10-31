import { useState } from 'react';
import { z } from 'zod';
import { Button } from '@eduos/ui';
import { useDemo } from '../../_component/demo-provider';
import { DemoForm, valueOf } from '../../_component/demo-form';
import { DataTable, Notice, PageHeading, Status } from '../../_component/demo-ui';
import { EnrollmentDates } from './enrollment-dates';

export function AcademicSettings() {
  const { state, dispatch, notify } = useDemo();
  const [editing, setEditing] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const offering = state.offerings.find((o) => o.id === editing);
  return (
    <>
      <PageHeading
        title="Academic setup"
        description="Maintain sessions, class offerings and assignments shared across the school."
        action={
          <Button
            onClick={() => {
              setEditing('');
              setShowForm(true);
            }}
          >
            Add class / section
          </Button>
        }
      />
      <DemoForm
        sections={[
          {
            title: 'Academic session',
            fields: [
              {
                name: 'session',
                label: 'Session name',
                value: state.settings.session ?? '',
                required: true,
              },
              {
                name: 'start',
                label: 'Starts',
                kind: 'date',
                value: state.settings.start ?? '',
                required: true,
              },
              {
                name: 'end',
                label: 'Ends',
                kind: 'date',
                value: state.settings.end ?? '',
                required: true,
              },
            ],
          },
        ]}
        submitLabel="Save session"
        onSubmit={async (values) => {
          if (valueOf(values, 'start') > valueOf(values, 'end')) {
            setError('The session end must be on or after its start.');
            return;
          }
          if (!(await dispatch({ type: 'settings-save', values }))) return;
          setError('');
          notify('Academic session updated.');
        }}
      />
      {error && (
        <Notice title="Review academic setup" tone="danger">
          {error}
        </Notice>
      )}
      <DataTable
        caption="Class and section offerings"
        headers={['Class', 'Session', 'Sections', 'Capacity', 'Class teacher', 'State', 'Action']}
      >
        {state.offerings.map((o) => (
          <tr key={o.id}>
            <td>{o.className}</td>
            <td>{o.session}</td>
            <td>{o.sections}</td>
            <td>{o.capacity}</td>
            <td>{state.members.find((m) => m.id === o.teacher)?.name ?? 'Unassigned'}</td>
            <td>
              <Status tone={o.active ? 'success' : 'neutral'}>
                {o.active ? 'Open' : 'Closed'}
              </Status>
            </td>
            <td>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditing(o.id);
                  setShowForm(true);
                }}
              >
                Edit offering
              </Button>
            </td>
          </tr>
        ))}
      </DataTable>
      {showForm && (
        <DemoForm
          key={editing || 'new'}
          sections={[
            {
              title: offering ? 'Edit class offering' : 'New class offering',
              fields: [
                {
                  name: 'className',
                  label: 'Class',
                  options: Array.from({ length: 10 }, (_, i) => `Class ${i + 1}`),
                  value: offering?.className ?? 'Class 1',
                  required: true,
                },
                {
                  name: 'session',
                  label: 'Session',
                  value: offering?.session ?? state.settings.session ?? '',
                  required: true,
                },
                {
                  name: 'sections',
                  label: 'Sections',
                  value: offering?.sections ?? 'A, B',
                  required: true,
                  helper: 'Separate section names with commas.',
                },
                {
                  name: 'capacity',
                  label: 'Capacity per section',
                  value: offering?.capacity ?? '',
                  required: true,
                },
                {
                  name: 'teacher',
                  label: 'Class teacher',
                  value:
                    offering?.teacher ??
                    state.members.find((m) => m.role === 'Teacher' && m.active)?.id ??
                    '',
                  options: state.members
                    .filter((m) => m.role === 'Teacher' && m.active)
                    .map((m) => m.id),
                  optionLabels: Object.fromEntries(state.members.map((m) => [m.id, m.name])),
                },
                {
                  name: 'active',
                  label: 'Open for intake',
                  kind: 'switch',
                  value: offering?.active === false ? 'no' : 'yes',
                },
              ],
            },
          ]}
          submitLabel="Save offering"
          footer={
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          }
          onSubmit={async (values) => {
            if (
              !z.coerce.number().int().positive().safeParse(valueOf(values, 'capacity')).success
            ) {
              setError('Class capacity must be a positive whole number.');
              return;
            }
            const className = valueOf(values, 'className');
            const session = valueOf(values, 'session');
            if (
              state.offerings.some(
                (o) => o.className === className && o.session === session && o.id !== editing,
              )
            ) {
              setError(
                'This class already has an offering in the selected session. Edit its sections instead.',
              );
              return;
            }
            if (
              !(await dispatch({
                type: 'offering-save',
                offering: {
                  id: offering?.id ?? crypto.randomUUID(),
                  className,
                  session,
                  sections: valueOf(values, 'sections'),
                  capacity: valueOf(values, 'capacity'),
                  teacher: valueOf(values, 'teacher'),
                  active: valueOf(values, 'active') === 'yes',
                },
              }))
            )
              return;
            setShowForm(false);
            setError('');
            notify('Class offering saved. New intake forms use the updated offerings.');
          }}
        />
      )}
      <EnrollmentDates />
      <Notice title="Keep academic history">
        A new academic session uses new enrollments and assignments. Prior attendance and published
        routines remain in their history.
      </Notice>
    </>
  );
}
