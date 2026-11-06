import { useLanguage } from '@eduos/ui';
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

export function TeacherRoutine() {
  const { t } = useLanguage();

  const { state, snapshot } = useDemo();
  const [teacher, setTeacher] = useState(
    snapshot.identity.role === 'Teacher'
      ? snapshot.identity.id
      : (state.members.find((m) => m.role === 'Teacher' && m.active)?.id ?? ''),
  );
  const grouped = new Map<string, typeof state.routineHistory>();
  for (const r of state.routineHistory) {
    const key = r.classId ?? r.className;
    grouped.set(key, [...(grouped.get(key) ?? []), r]);
  }
  const publishedRoutines = [...grouped.values()].flatMap((versions) => {
    const sorted = versions.toSorted(
      (a, b) => b.effective.localeCompare(a.effective) || b.version - a.version,
    );
    const selected = sorted.find((r) => r.effective <= snapshot.today) ?? sorted.at(-1);
    return selected ? [selected] : [];
  });
  const published = publishedRoutines.at(-1);
  if (!published)
    return (
      <EmptyState
        title={t('No published routine')}
        action={<DemoLink to="/routine">{t('Open routine builder')}</DemoLink>}
      >
        {t('Publish the first complete routine to make it available to teachers.')}{' '}
      </EmptyState>
    );
  const lessons = publishedRoutines
    .flatMap((routine) => routine.lessons.map((l) => ({ ...l, routine })))
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
          title={t('Teacher routine')}
          description={`${state.members.find((m) => m.id === teacher)?.name ?? 'Teacher'} · Academic session ${state.settings.session}`}
          action={
            <Button variant="outline" onClick={() => window.print()}>
              <Printer size={16} />
              {t('Print routine')}{' '}
            </Button>
          }
        />
      </div>
      <Notice
        title={t('Published · Version {value0}', { value0: published.version })}
        tone="success"
      >
        {t('Effective from')} {published.effective} · {published.className}. Unsaved draft changes
        do not appear in the teacher view.
      </Notice>
      <div className="demo-filters demo-print-hide">
        <Choice
          id="routine-teacher"
          label={t('Teacher')}
          value={teacher}
          optionLabels={Object.fromEntries(state.members.map((m) => [m.id, m.name]))}
          options={state.members
            .filter(
              (m) =>
                m.role === 'Teacher' &&
                m.active &&
                (snapshot.identity.role !== 'Teacher' || m.id === snapshot.identity.id),
            )
            .map((m) => m.id)}
          onChange={setTeacher}
        />
      </div>
      <Metrics
        items={[
          {
            label: 'Teaching periods',
            value: lessons.length,
            detail: 'Current published assignments',
          },
          {
            label: 'Class / section',
            value: new Set(lessons.map((l) => l.routine.classId ?? l.routine.className)).size,
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
        <EmptyState title={t('No teaching periods')}>
          {t('This teacher has no lessons in the selected published class routine.')}{' '}
        </EmptyState>
      ) : (
        <DataTable
          caption={t('Published teacher timetable')}
          headers={['Day', 'Period / time', 'Subject', 'Class / section', 'Room']}
        >
          {lessons.map((l) => {
            const p = l.routine.periods.find((p) => p.id === l.period);
            return (
              <tr key={`${l.routine.classId ?? l.routine.className}-${l.id}`}>
                <td>{l.day}</td>
                <td>
                  {t('Period')} {l.period}
                  <small>
                    {p?.start}–{p?.end}
                  </small>
                </td>
                <td>{l.subject}</td>
                <td>
                  {l.routine.className} · {l.routine.session}
                </td>
                <td>{l.room}</td>
              </tr>
            );
          })}
        </DataTable>
      )}
      <Panel title={t('Routine history')}>
        <DataTable
          caption={t('Published routine versions')}
          headers={['Version', 'Effective from', 'Class', 'Publication note']}
        >
          {state.routineHistory.toReversed().map((r) => (
            <tr key={`${r.classId ?? r.className}-${r.version}`}>
              <td>
                {t('Version')} {r.version}
              </td>
              <td>{r.effective}</td>
              <td>{r.className}</td>
              <td>{r.note || t('Initial school routine')}</td>
            </tr>
          ))}
        </DataTable>
      </Panel>
    </>
  );
}
