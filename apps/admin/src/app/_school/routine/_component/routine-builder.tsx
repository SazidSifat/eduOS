import { useLanguage } from '@eduos/ui';
import { Fragment } from 'react';
import { Link } from '@tanstack/react-router';
import { Plus } from 'lucide-react';
import { useDemo } from '../../_component/demo-provider';
import { DemoLink, Notice, PageHeading, Status } from '../../_component/demo-ui';
import { unassignedSlots } from './routine-validation';

export function RoutineBuilder() {
  const { t } = useLanguage();

  const { state, snapshot } = useDemo();
  const routine = state.routine;
  const conflicts = snapshot.routineConflicts;
  const missing = unassignedSlots(routine);
  return (
    <>
      <PageHeading
        title={t('Class routine')}
        description={t('{value0} · Academic session {value1} · Effective from {value2}', {
          value0: routine.className,
          value1: state.settings.session,
          value2: routine.effective,
        })}
        action={
          <DemoLink to="/routine/new" primary>
            {t('Configure routine')}{' '}
          </DemoLink>
        }
      />
      <div className="demo-row-actions flex-wrap">
        <Status tone={routine.published ? 'success' : 'warning'}>
          {routine.published
            ? t('Published · Version {value0}', { value0: routine.version })
            : t('Draft')}
        </Status>
        <span className="text-muted-foreground">
          {routine.lessons.length} {t('of')} {routine.days.length * routine.periods.length}
          {t('lessons assigned ·')}
          {missing.length}
          {t('unassigned ·')}
          {conflicts.length}
          {t('conflicts')}
        </span>
      </div>
      <div className="demo-routine-wrap">
        <table className="demo-routine-table" style={{ minWidth: 100 + routine.days.length * 170 }}>
          <caption className="sr-only">{t('Weekly class routine')}</caption>
          <thead>
            <tr>
              <th scope="col">{t('Period')}</th>
              {routine.days.map((day) => (
                <th scope="col" key={day}>
                  {t(day)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {routine.periods.map((period, index) => (
              <Fragment key={period.id}>
                {index > 0 && (routine.periods[index - 1]?.end ?? '') < period.start && (
                  <tr>
                    <td colSpan={routine.days.length + 1} className="demo-break">
                      {t('Break ·')}
                      {routine.periods[index - 1]?.end}–{period.start}
                    </td>
                  </tr>
                )}
                <tr>
                  <th scope="row" className="demo-period">
                    <p>
                      {t('Period')} {period.id}
                    </p>
                    <small>
                      {period.start}–{period.end}
                    </small>
                  </th>
                  {routine.days.map((day) => {
                    const lesson = routine.lessons.find(
                      (l) => l.day === day && l.period === period.id,
                    );
                    const conflict = lesson && conflicts.some((c) => c.lessonId === lesson.id);
                    return (
                      <td key={`${day}-${period.id}`} className={conflict ? 'demo-warning' : ''}>
                        <Link
                          to="/routine/lesson"
                          search={{ day, period: period.id }}
                          aria-label={
                            lesson
                              ? t('Edit {value0}, {value1} period {value2}', {
                                  value0: lesson.subject,
                                  value1: day,
                                  value2: period.id,
                                })
                              : t('Add lesson, {value0} period {value1}', {
                                  value0: day,
                                  value1: period.id,
                                })
                          }
                        >
                          {lesson ? (
                            <>
                              <p>{lesson.subject}</p>
                              <small>
                                {state.members.find((m) => m.id === lesson.teacher)?.name ??
                                  t('Unassigned')}
                              </small>
                              <small>
                                {lesson.room}
                                {conflict ? ' · Conflict' : ''}
                              </small>
                            </>
                          ) : (
                            <>
                              <Plus size={16} aria-hidden="true" />
                              <p>{t('Add lesson')}</p>
                              <small>{t('Unassigned period')}</small>
                            </>
                          )}
                        </Link>
                      </td>
                    );
                  })}
                </tr>
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <div className="demo-actions">
        <DemoLink to="/routine/teacher">{t('Teacher routine')}</DemoLink>
        <DemoLink to="/routine/review" primary>
          {t('Review & publish')}{' '}
        </DemoLink>
      </div>
      <Notice title={t('Drafts do not replace the published routine')}>
        {t(
          'Publish a complete, conflict-free version with an effective date. Earlier published versions remain available in the routine history.',
        )}{' '}
      </Notice>
    </>
  );
}
