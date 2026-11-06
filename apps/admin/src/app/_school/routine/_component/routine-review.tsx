import { useLanguage } from '@eduos/ui';
import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Button, Input, Label } from '@eduos/ui';
import { useDemo } from '../../_component/demo-provider';
import { DemoLink, Metrics, Notice, PageHeading, Panel } from '../../_component/demo-ui';
import { unassignedSlots } from './routine-validation';

export function RoutineReview() {
  const { t } = useLanguage();

  const { state, snapshot, dispatch, notify } = useDemo();
  const navigate = useNavigate();
  const [note, setNote] = useState('Version 2 · Adjusted teacher and classroom allocations.');
  const routine = state.routine;
  const issues = snapshot.routineConflicts;
  const missing = unassignedSlots(routine);

  const teacherConflicts = issues.filter((i) => i.kind === 'teacher').length;
  const roomConflicts = issues.filter((i) => i.kind === 'room').length;
  const ready =
    routine.days.length > 0 &&
    routine.periods.length > 0 &&
    issues.length === 0 &&
    missing.length === 0;

  return (
    <>
      <PageHeading
        title={t('Review and publish')}
        description={t('{value0} · Effective from {value1} · {value2}', {
          value0: routine.className,
          value1: routine.effective,
          value2: routine.published ? `Published version ${routine.version}` : 'Draft version 2',
        })}
      />
      <Metrics
        items={[
          {
            label: 'Scheduled lessons',
            value: `${routine.lessons.length} / ${routine.days.length * routine.periods.length}`,
            detail: missing.length
              ? t('{value0} unassigned', { value0: missing.length })
              : 'All required slots filled',
          },
          {
            label: 'Teacher conflicts',
            value: teacherConflicts,
            detail: teacherConflicts ? 'Overlapping assignment' : 'No overlapping lessons',
          },
          {
            label: 'Room conflicts',
            value: roomConflicts,
            detail: roomConflicts ? 'Room booked twice' : 'Room allocation verified',
          },
          {
            label: 'Ready to publish',
            value: ready ? 'Ready' : 'Blocked',
            detail: ready ? 'Conflict checks passed' : 'Resolve all conflicts',
          },
        ]}
      />
      <Notice
        title={
          ready
            ? t('All conflicts resolved')
            : t('{value0} conflict{value1} need resolution', {
                value0: issues.length,
                value1: issues.length === 1 ? '' : 's',
              })
        }
        tone={ready ? 'success' : 'warning'}
      >
        {ready
          ? t('Teacher availability and room allocation pass the scheduled routine checks.')
          : t(
              'A routine cannot be published while a teacher or room is assigned to overlapping lessons.',
            )}
      </Notice>

      {issues.map((issue) => (
        <Panel
          title={`${issue.kind === 'teacher' ? 'Teacher conflict' : 'Room conflict'} · ${issue.title}`}
          key={`${issue.lessonId}-${issue.kind}`}
          description={issue.detail}
        >
          <div className="mt-3 rounded border border-border bg-muted/40 p-3">
            <span className="text-xs font-semibold text-muted-foreground">
              {t('Suggested change')}
            </span>
            <p className="mt-1 text-sm font-medium">
              {issue.kind === 'teacher'
                ? t(
                    'Move this lesson to an available teaching period or assign an alternate teacher.',
                  )
                : t('Assign an alternate available classroom and confirm room suitability.')}
            </p>
          </div>
          <div className="mt-4 flex justify-end">
            <DemoLink to="/routine">{t('Edit in builder')}</DemoLink>
          </div>
        </Panel>
      ))}

      {!!missing.length && (
        <Panel
          title={t('Unassigned periods')}
          description={t('Every slot must be assigned before publishing.')}
        >
          <p className="text-sm text-muted-foreground">
            {missing
              .map((slot) =>
                t('{value0} Period {value1}', { value0: slot.day, value1: slot.period }),
              )
              .join(' · ')}
          </p>
          <div className="mt-4 flex justify-end">
            <DemoLink to="/routine">{t('Add missing lessons')}</DemoLink>
          </div>
        </Panel>
      )}

      <div className="demo-field">
        <Label htmlFor="routine-note">{t('Publication note')}</Label>
        <Input
          id="routine-note"
          value={note}
          maxLength={500}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t('Version note or change summary')}
        />
      </div>

      <div className="demo-actions">
        <DemoLink to="/routine">{t('Back to builder')}</DemoLink>
        <Button
          disabled={!ready || routine.published}
          onClick={async () => {
            if (!(await dispatch({ type: 'routine-publish', note }))) return;
            notify('Routine published. The previous version remains in history.');
            void navigate({ to: '/routine/teacher' });
          }}
        >
          {routine.published
            ? t('Already published')
            : t('Publish version {value0}', { value0: routine.version + 1 })}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        {t(
          'Publishing keeps the previous version in history and applies this version from its effective date.',
        )}{' '}
      </p>
    </>
  );
}
