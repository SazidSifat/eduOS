import { useState } from 'react';
import { DatePicker, Label } from '@eduos/ui';
import { useDemo } from '../../_component/demo-provider';
import { classes, DEMO_TODAY, roster } from '../../_component/demo-data';
import {
  Choice,
  DataTable,
  ExportButton,
  Metrics,
  Notice,
  PageHeading,
} from '../../_component/demo-ui';

export function AttendanceMonthly() {
  const { state } = useDemo();
  const [date, setDate] = useState(DEMO_TODAY);
  const [classId, setClassId] = useState('3-a');
  const [year, month] = date.split('-').map(Number);
  const days = Array.from(
    { length: new Date(Date.UTC(year ?? 2026, month ?? 10, 0)).getUTCDate() },
    (_, i) => `${date.slice(0, 7)}-${String(i + 1).padStart(2, '0')}`,
  );
  const registers = state.registers.filter(
    (r) => r.classId === classId && r.date.startsWith(date.slice(0, 7)) && r.submitted,
  );
  const students = roster(classId);
  const includeLate = state.settings.lateIncluded !== 'no';
  function counts(id: string) {
    const present = registers.filter((r) => r.marks[id] === 'Present').length;
    const absent = registers.filter((r) => r.marks[id] === 'Absent').length;
    const late = registers.filter((r) => r.marks[id] === 'Late').length;
    const marked = present + absent + late;
    return {
      present,
      absent,
      late,
      rate: marked ? ((present + (includeLate ? late : 0)) / marked) * 100 : null,
    };
  }
  const rates = students
    .map((s) => counts(s.id).rate)
    .filter((rate): rate is number => rate !== null);
  return (
    <>
      <PageHeading
        title="Monthly attendance"
        description="Review daily statuses, repeated absence and missing registers."
        action={
          <ExportButton
            filename="class-attendance-demo"
            headers={['Student', 'Present', 'Absent', 'Late', 'Attendance rate']}
            rows={students.map((s) => {
              const c = counts(s.id);
              return [
                s.name,
                c.present,
                c.absent,
                c.late,
                c.rate === null ? 'No submitted register' : `${c.rate.toFixed(1)}%`,
              ];
            })}
          />
        }
      />
      <div className="demo-filters">
        <div>
          <Label htmlFor="monthly-date">Month containing</Label>
          <DatePicker id="monthly-date" value={date} onValueChange={setDate} />
        </div>
        <Choice
          id="monthly-class"
          label="Class / section"
          options={classes.map((c) => c.label)}
          value={classes.find((c) => c.id === classId)?.label ?? ''}
          onChange={(label) => {
            const c = classes.find((c) => c.label === label);
            if (c) setClassId(c.id);
          }}
        />
      </div>
      <Metrics
        items={[
          {
            label: 'Attendance rate',
            value: rates.length
              ? `${(rates.reduce((sum, rate) => sum + rate, 0) / rates.length).toFixed(1)}%`
              : '—',
            detail: includeLate ? 'Present + late / marked days' : 'Present / marked days',
          },
          {
            label: 'Submitted registers',
            value: registers.length,
            detail: 'Selected month and class',
          },
          {
            label: 'Below 80%',
            value: rates.filter((rate) => rate < 80).length,
            detail: 'Review absence history',
          },
          { label: 'Active roster', value: students.length, detail: 'Current class enrollments' },
        ]}
      />
      <p className="demo-help">
        P Present · A Absent · L Late · H Weekly closure · — No submitted register. Scroll
        horizontally for the full month.
      </p>
      <div className="demo-monthly">
        <DataTable
          caption="Monthly student attendance matrix"
          headers={['Student', ...days.map((day) => day.slice(-2)), 'P / A / L', 'Rate']}
        >
          {students.map((s) => {
            const c = counts(s.id);
            return (
              <tr key={s.id}>
                <td>
                  <strong>{s.name}</strong>
                </td>
                {days.map((day) => {
                  const weekday = new Date(`${day}T12:00:00+06:00`).getUTCDay();
                  const mark = registers.find((r) => r.date === day)?.marks[s.id];
                  return (
                    <td key={day} className={mark === 'Absent' ? 'text-destructive' : ''}>
                      {mark ? mark.slice(0, 1) : [5, 6].includes(weekday) ? 'H' : '—'}
                    </td>
                  );
                })}
                <td>
                  {c.present} / {c.absent} / {c.late}
                </td>
                <td>{c.rate === null ? '—' : `${c.rate.toFixed(1)}%`}</td>
              </tr>
            );
          })}
        </DataTable>
      </div>
      <Notice title="Unsubmitted days are excluded">
        Missing registers and holidays are not counted as student absence. Only submitted, marked
        days contribute to the attendance-rate denominator.
      </Notice>
    </>
  );
}
