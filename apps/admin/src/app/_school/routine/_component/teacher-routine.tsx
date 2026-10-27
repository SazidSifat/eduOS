import { useState } from 'react';
import { Button } from '@eduos/ui';
import { Printer } from 'lucide-react';
import { useDemo } from '../../_component/demo-provider';
import {
  Choice,
  DataTable,
  DemoLink,
  EmptyState,
  Metrics,
  Notice,
  PageHeading,
  Panel,
} from '../../_component/demo-ui';
import { subjects } from './routine-model';

export function TeacherRoutine() {
  const { state } = useDemo();
  const [teacher, setTeacher] = useState('Farhana Akter');
  const published = state.routineHistory.at(-1);
  if (!published)
    return (
      <EmptyState
        title="No published routine"
        action={<DemoLink to="/routine">Open routine builder</DemoLink>}
      >
        Publish the first complete routine to make it available to teachers.
      </EmptyState>
    );
  const lessons = published.lessons
    .filter((l) => l.teacher === teacher)
    .toSorted(
      (a, b) =>
        published.days.indexOf(a.day) - published.days.indexOf(b.day) ||
        Number(a.period) - Number(b.period),
    );
  return (
    <>
      <div className="demo-print-hide">
        <PageHeading
          title="Teacher routine"
          description={`${teacher} · Academic session ${state.settings.session}`}
          action={
            <Button variant="outline" onClick={() => window.print()}>
              <Printer size={16} />
              Print routine
            </Button>
          }
        />
      </div>
      <Notice title={`Published · Version ${published.version}`} tone="success">
        Effective from {published.effective} · {published.className}. Unsaved draft changes do not
        appear in the teacher view.
      </Notice>
      <div className="demo-filters demo-print-hide">
        <Choice
          id="routine-teacher"
          label="Teacher"
          value={teacher}
          options={subjects.map((s) => s.teacher)}
          onChange={setTeacher}
        />
      </div>
      <Metrics
        items={[
          {
            label: 'Teaching periods',
            value: lessons.length,
            detail: 'Selected published routine',
          },
          {
            label: 'Class / section',
            value: published.className.replace('Class ', ''),
            detail: 'Assigned class',
          },
          {
            label: 'Routine version',
            value: published.version,
            detail: `Effective ${published.effective}`,
          },
        ]}
      />
      {!lessons.length ? (
        <EmptyState title="No teaching periods">
          This teacher has no lessons in the selected published class routine.
        </EmptyState>
      ) : (
        <DataTable
          caption="Published teacher timetable"
          headers={['Day', 'Period / time', 'Subject', 'Class / section', 'Room']}
        >
          {lessons.map((l) => {
            const p = published.periods.find((p) => p.id === l.period);
            return (
              <tr key={l.id}>
                <td>{l.day}</td>
                <td>
                  Period {l.period}
                  <small>
                    {p?.start}–{p?.end}
                  </small>
                </td>
                <td>{l.subject}</td>
                <td>{published.className}</td>
                <td>{l.room}</td>
              </tr>
            );
          })}
        </DataTable>
      )}
      <Panel title="Routine history">
        <DataTable
          caption="Published routine versions"
          headers={['Version', 'Effective from', 'Class', 'Publication note']}
        >
          {state.routineHistory.toReversed().map((r) => (
            <tr key={r.version}>
              <td>Version {r.version}</td>
              <td>{r.effective}</td>
              <td>{r.className}</td>
              <td>{r.note || 'Initial school routine'}</td>
            </tr>
          ))}
        </DataTable>
      </Panel>
    </>
  );
}
