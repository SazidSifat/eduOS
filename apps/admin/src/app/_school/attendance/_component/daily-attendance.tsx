import { useLanguage } from '@eduos/ui';
import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Button, DatePicker, Input, Label } from '@eduos/ui';
import { useDemo } from '../../_component/demo-provider';

import type { AttendanceMark } from '../../_component/demo-model';
import {
  Choice,
  EmptyState,
  DataTable,
  DemoLink,
  Metrics,
  Notice,
  PageHeading,
  Status,
} from '../../_component/demo-ui';
import { currentRegister, markCounts, markOptions } from './attendance-model';

export function DailyAttendance() {
  const { t } = useLanguage();

  const { state, dispatch, notify, classes, roster } = useDemo();
  const [search, setSearch] = useState('');
  const register = currentRegister(state);
  if (!register)
    return (
      <EmptyState title={t('No class register available')}>
        {t(
          'Configure an academic offering and class teacher, then enroll students to start attendance.',
        )}{' '}
      </EmptyState>
    );
  const counts = markCounts(register);
  const students = roster(register.classId, register.date).filter((s) =>
    `${s.name} ${s.roll}`.toLowerCase().includes(search.toLowerCase()),
  );
  function controls(id: string, mark: AttendanceMark) {
    return (
      <fieldset
        className="demo-attendance-controls"
        aria-label={t('Attendance for {value0}', {
          value0:
            roster(register?.classId ?? '', register?.date).find((s) => s.id === id)?.name ??
            'student',
        })}
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
            {t(value)}
          </Button>
        ))}
      </fieldset>
    );
  }
  return (
    <>
      <PageHeading
        title={t('Daily attendance')}
        description={t('{value0} · {value1} · Class teacher: {value2}', {
          value0: classes.find((c) => c.id === register.classId)?.label,
          value1: register.date,
          value2:
            state.members.find(
              (m) => m.id === classes.find((c) => c.id === register.classId)?.teacherId,
            )?.name ?? 'Unassigned',
        })}
      />
      <div className="demo-filters">
        <div>
          <Label htmlFor="attendance-date">{t('Register date')}</Label>
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
          label={t('Class / section')}
          value={classes.find((c) => c.id === register.classId)?.label ?? 'Class 3 · A'}
          options={classes.map((c) => c.label)}
          onChange={async (label) => {
            const c = classes.find((c) => c.label === label);
            if (c)
              if (
                !(await dispatch({ type: 'register-select', date: register.date, classId: c.id }))
              )
                return;
          }}
        />
      </div>
      <div className="demo-row-actions">
        <Status tone={register.submitted ? 'success' : 'warning'}>
          {register.submitted
            ? t('Submitted')
            : register.saved
              ? t('Saved draft')
              : t('Unsaved draft')}
        </Status>
        <span className="demo-help">
          {roster(register.classId, register.date).length} {t('active enrollments')}{' '}
        </span>
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
          <Label htmlFor="roster-search">{t('Find a student')}</Label>
          <Input
            id="roster-search"
            placeholder={t('Student name or roll')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button
          variant="outline"
          disabled={register.submitted || counts.Unmarked === 0}
          onClick={() => dispatch({ type: 'attendance-bulk' })}
        >
          {t('Mark unmarked present')}{' '}
        </Button>
      </div>
      <div className="demo-roster-table">
        <DataTable
          caption={t('Daily class attendance')}
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
                    {t(mark)}
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
            <p className="demo-help">{t(register.marks[student.id] ?? 'Unmarked')}</p>
            {controls(student.id, register.marks[student.id] ?? 'Unmarked')}
          </section>
        ))}
      </div>
      {!students.length && (
        <p className="text-muted-foreground">
          {Object.keys(register.marks).length
            ? t('No students match this name or roll.')
            : t('No students are enrolled for this date.')}
        </p>
      )}
      {counts.Unmarked > 0 && (
        <Notice
          title={t('{value0} students still need a status', { value0: counts.Unmarked })}
          tone="warning"
        >
          {t(
            'Mark every student before reviewing and submitting. Saving a draft does not publish attendance.',
          )}{' '}
        </Notice>
      )}
      {register.submitted ? (
        <div className="demo-actions">
          <DemoLink to="/attendance/corrections">{t('Request correction')}</DemoLink>
          <DemoLink to="/attendance/submitted" primary>
            {t('View submission')}{' '}
          </DemoLink>
        </div>
      ) : (
        <div className="demo-actions">
          <Button
            variant="outline"
            disabled={Object.keys(register.marks).length === 0}
            onClick={async () => {
              if (!(await dispatch({ type: 'attendance-save' }))) return;
              notify('Attendance draft saved to the school record. It is not yet submitted.');
            }}
          >
            {t('Save draft')}{' '}
          </Button>
          {counts.Unmarked > 0 || Object.keys(register.marks).length === 0 ? (
            <Button disabled>{t('Review register')}</Button>
          ) : (
            <Button asChild>
              <Link to="/attendance/review">{t('Review register')}</Link>
            </Button>
          )}
        </div>
      )}
    </>
  );
}
