import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Button, Input, Label } from '@eduos/ui';
import { useDemo } from '../../_component/demo-provider';
import { DemoLink, Metrics, Notice, PageHeading, Panel } from '../../_component/demo-ui';
import { unassignedSlots } from './routine-validation';

export function RoutineReview() {
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
        title="Review and publish"
        description={`${routine.className} · Effective from ${routine.effective} · ${routine.published ? `Published version ${routine.version}` : 'Draft version 2'}`}
      />
      <Metrics
        items={[
          {
            label: 'Scheduled lessons',
            value: `${routine.lessons.length} / ${routine.days.length * routine.periods.length}`,
            detail: missing.length ? `${missing.length} unassigned` : 'All required slots filled',
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
            ? 'All conflicts resolved'
            : `${issues.length} conflict${issues.length === 1 ? '' : 's'} need resolution`
        }
        tone={ready ? 'success' : 'warning'}
      >
        {ready
          ? 'Teacher availability and room allocation pass the scheduled routine checks.'
          : 'A routine cannot be published while a teacher or room is assigned to overlapping lessons.'}
      </Notice>

      {issues.map((issue) => (
        <Panel
          title={`${issue.kind === 'teacher' ? 'Teacher conflict' : 'Room conflict'} · ${issue.title}`}
          key={`${issue.lessonId}-${issue.kind}`}
          description={issue.detail}
        >
          <div className="mt-3 rounded border border-border bg-muted/40 p-3">
            <span className="text-xs font-semibold text-muted-foreground">Suggested change</span>
            <p className="mt-1 text-sm font-medium">
              {issue.kind === 'teacher'
                ? 'Move this lesson to an available teaching period or assign an alternate teacher.'
                : 'Assign an alternate available classroom and confirm room suitability.'}
            </p>
          </div>
          <div className="mt-4 flex justify-end">
            <DemoLink to="/routine">Edit in builder</DemoLink>
          </div>
        </Panel>
      ))}

      {!!missing.length && (
        <Panel
          title="Unassigned periods"
          description="Every slot must be assigned before publishing."
        >
          <p className="text-sm text-muted-foreground">
            {missing.map((slot) => `${slot.day} Period ${slot.period}`).join(' · ')}
          </p>
          <div className="mt-4 flex justify-end">
            <DemoLink to="/routine">Add missing lessons</DemoLink>
          </div>
        </Panel>
      )}

      <div className="demo-field">
        <Label htmlFor="routine-note">Publication note</Label>
        <Input
          id="routine-note"
          value={note}
          maxLength={500}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Version note or change summary"
        />
      </div>

      <div className="demo-actions">
        <DemoLink to="/routine">Back to builder</DemoLink>
        <Button
          disabled={!ready || routine.published}
          onClick={async () => {
            if (!(await dispatch({ type: 'routine-publish', note }))) return;
            notify('Routine published. The previous version remains in history.');
            void navigate({ to: '/routine/teacher' });
          }}
        >
          {routine.published ? 'Already published' : `Publish version ${routine.version + 1}`}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Publishing keeps the previous version in history and applies this version from its effective
        date.
      </p>
    </>
  );
}
