import { Fragment } from 'react';
import { Link } from '@tanstack/react-router';
import { Plus } from 'lucide-react';
import { useDemo } from '../../_component/demo-provider';
import { DemoLink, Notice, PageHeading, Status } from '../../_component/demo-ui';
import { routineConflicts, unassignedSlots } from './routine-model';

export function RoutineBuilder() {
  const { state } = useDemo();
  const routine = state.routine;
  const conflicts = routineConflicts(routine);
  const missing = unassignedSlots(routine);
  return (
    <>
      <PageHeading
        title="Class routine"
        description={`${routine.className} · Academic session ${state.settings.session} · Effective from ${routine.effective}`}
        action={
          <DemoLink to="/routine/new" primary>
            Configure routine
          </DemoLink>
        }
      />
      <div className="demo-row-actions flex-wrap">
        <Status tone={routine.published ? 'success' : 'warning'}>
          {routine.published ? `Published · Version ${routine.version}` : 'Draft'}
        </Status>
        <span className="text-muted-foreground">
          {routine.lessons.length} of {routine.days.length * routine.periods.length} lessons
          assigned · {missing.length} unassigned · {conflicts.length} conflicts
        </span>
      </div>
      <div className="demo-routine-wrap">
        <table className="demo-routine-table" style={{ minWidth: 100 + routine.days.length * 170 }}>
          <caption className="sr-only">Weekly class routine</caption>
          <thead>
            <tr>
              <th scope="col">Period</th>
              {routine.days.map((day) => (
                <th scope="col" key={day}>
                  {day}
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
                      Break · {routine.periods[index - 1]?.end}–{period.start}
                    </td>
                  </tr>
                )}
                <tr>
                  <th scope="row" className="demo-period">
                    <p>Period {period.id}</p>
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
                              ? `Edit ${lesson.subject}, ${day} period ${period.id}`
                              : `Add lesson, ${day} period ${period.id}`
                          }
                        >
                          {lesson ? (
                            <>
                              <p>{lesson.subject}</p>
                              <small>{lesson.teacher}</small>
                              <small>
                                {lesson.room}
                                {conflict ? ' · Conflict' : ''}
                              </small>
                            </>
                          ) : (
                            <>
                              <Plus size={16} aria-hidden="true" />
                              <p>Add lesson</p>
                              <small>Unassigned period</small>
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
        <DemoLink to="/routine/teacher">Teacher routine</DemoLink>
        <DemoLink to="/routine/review" primary>
          Review & publish
        </DemoLink>
      </div>
      <Notice title="Drafts do not replace the published routine">
        Publish a complete, conflict-free version with an effective date. Earlier published versions
        remain available in the routine history.
      </Notice>
    </>
  );
}
