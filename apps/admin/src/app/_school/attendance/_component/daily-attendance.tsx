import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Button, DatePicker, Input, Label } from '@eduos/ui';
import { useDemo } from '../../_component/demo-provider';
import { classes, roster } from '../../_component/demo-data';
import type { AttendanceMark } from '../../_component/demo-model';
import {
  Choice,
  DataTable,
  DemoLink,
  Metrics,
  Notice,
  PageHeading,
  Status,
} from '../../_component/demo-ui';
import { currentRegister, markCounts, markOptions } from './attendance-model';

export function DailyAttendance() {
  const { state, dispatch, notify } = useDemo();
  const [search, setSearch] = useState('');
  const register = currentRegister(state);
  if (!register) return null;
  const counts = markCounts(register);
  const students = roster(register.classId).filter((s) =>
    `${s.name} ${s.roll}`.toLowerCase().includes(search.toLowerCase()),
  );
  function controls(id: string, mark: AttendanceMark) {
    return (
      <fieldset
        className="demo-attendance-controls"
        aria-label={`Attendance for ${roster(register?.classId ?? '3-a').find((s) => s.id === id)?.name ?? 'student'}`}
      >
        {markOptions.map((value) => (
          <Button
            key={value}
            size="sm"
            variant={mark === value ? 'default' : 'outline'}
            aria-pressed={mark === value}
            disabled={register?.submitted}
            onClick={() => dispatch({ type: 'attendance-mark', studentId: id, mark: value })}
          >
            {value}
          </Button>
        ))}
      </fieldset>
    );
  }
  return (
    <>
      <PageHeading
        title="Daily attendance"
        description={`${classes.find((c) => c.id === register.classId)?.label} · ${register.date} · Class teacher: Farhana Akter`}
        action={<DemoLink to="/attendance/monthly">Monthly report</DemoLink>}
      />
      <div className="demo-filters">
        <div>
          <Label htmlFor="attendance-date">Register date</Label>
          <DatePicker
            id="attendance-date"
            value={register.date}
            onValueChange={(date) =>
              dispatch({ type: 'register-select', date, classId: register.classId })
            }
          />
        </div>
        <Choice
          id="attendance-class"
          label="Class / section"
          value={classes.find((c) => c.id === register.classId)?.label ?? 'Class 3 · A'}
          options={classes.map((c) => c.label)}
          onChange={(label) => {
            const c = classes.find((c) => c.label === label);
            if (c) dispatch({ type: 'register-select', date: register.date, classId: c.id });
          }}
        />
      </div>
      <div className="demo-row-actions">
        <Status tone={register.submitted ? 'success' : 'warning'}>
          {register.submitted ? 'Submitted' : register.saved ? 'Saved draft' : 'Unsaved draft'}
        </Status>
        <span className="demo-help">{roster(register.classId).length} active enrollments</span>
      </div>
      <Metrics
        items={[
          { label: 'Present', value: counts.Present, detail: 'Marked present' },
          { label: 'Absent', value: counts.Absent, detail: 'Guardian follow-up' },
          { label: 'Late', value: counts.Late, detail: 'Included separately' },
          { label: 'Unmarked', value: counts.Unmarked, detail: 'Required before submission' },
        ]}
      />
      <div className="demo-filters">
        <div>
          <Label htmlFor="roster-search">Find a student</Label>
          <Input
            id="roster-search"
            placeholder="Student name or roll"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button
          variant="outline"
          disabled={register.submitted || counts.Unmarked === 0}
          onClick={() => dispatch({ type: 'attendance-bulk' })}
        >
          Mark unmarked present
        </Button>
      </div>
      <div className="demo-roster-table">
        <DataTable
          caption="Daily class attendance"
          headers={['Roll / student', 'Attendance', 'Status']}
        >
          {students.map((student) => {
            const mark = register.marks[student.id] ?? 'Unmarked';
            return (
              <tr key={student.id}>
                <td>
                  <strong>
                    {student.roll} · {student.name}
                  </strong>
                  <small>{student.id}</small>
                </td>
                <td>{controls(student.id, mark)}</td>
                <td>
                  <Status
                    tone={mark === 'Present' ? 'success' : mark === 'Absent' ? 'danger' : 'warning'}
                  >
                    {mark}
                  </Status>
                </td>
              </tr>
            );
          })}
        </DataTable>
      </div>
      <div className="demo-roster-cards">
        {students.map((student) => (
          <section key={student.id} className="demo-student-card">
            <h2>
              {student.roll} · {student.name}
            </h2>
            <p className="demo-help">{register.marks[student.id] ?? 'Unmarked'}</p>
            {controls(student.id, register.marks[student.id] ?? 'Unmarked')}
          </section>
        ))}
      </div>
      {!students.length && (
        <p className="text-muted-foreground">No students match this name or roll.</p>
      )}
      {counts.Unmarked > 0 && (
        <Notice title={`${counts.Unmarked} students still need a status`} tone="warning">
          Mark every student before reviewing and submitting. Saving a draft does not publish
          attendance.
        </Notice>
      )}
      {register.submitted ? (
        <div className="demo-actions">
          <DemoLink to="/attendance/corrections">Request correction</DemoLink>
          <DemoLink to="/attendance/submitted" primary>
            View submission
          </DemoLink>
        </div>
      ) : (
        <div className="demo-actions">
          <Button
            variant="outline"
            onClick={() => {
              dispatch({ type: 'attendance-save' });
              notify('Attendance draft saved in memory. It is not yet submitted.');
            }}
          >
            Save draft
          </Button>
          {counts.Unmarked > 0 ? (
            <Button disabled>Review register</Button>
          ) : (
            <Button asChild>
              <Link to="/attendance/review">Review register</Link>
            </Button>
          )}
        </div>
      )}
    </>
  );
}
