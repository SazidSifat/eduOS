import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Button, Input, Label } from '@eduos/ui';
import { useDemo } from '../../_component/demo-provider';
import { DemoLink, Metrics, Notice, PageHeading, Panel } from '../../_component/demo-ui';
import { routineConflicts, unassignedSlots } from './routine-model';

export function RoutineReview() {
  const { state, dispatch, notify } = useDemo();
  const navigate = useNavigate();
  const [note, setNote] = useState('Adjusted teacher and classroom allocations.');
  const routine = state.routine;
  const issues = routineConflicts(routine);
  const missing = unassignedSlots(routine);
  const ready = issues.length === 0 && missing.length === 0;
  return (
    <>
      <PageHeading
        title="Review and publish"
        description={`${routine.className} · Effective from ${routine.effective} · ${routine.published ? `Published version ${routine.version}` : 'Draft routine'}`}
      />
      <Metrics
        items={[
          {
            label: 'Scheduled lessons',
            value: `${routine.lessons.length} / ${routine.days.length * routine.periods.length}`,
            detail: 'Teaching slots',
          },
          {
            label: 'Teacher conflicts',
            value: issues.filter((i) => i.kind === 'teacher').length,
            detail: 'Overlapping assignments',
          },
          {
            label: 'Room conflicts',
            value: issues.filter((i) => i.kind === 'room').length,
            detail: 'Room allocation',
          },
          {
            label: 'Unassigned periods',
            value: missing.length,
            detail: 'Required before publishing',
          },
        ]}
      />
      <Notice
        title={
          ready
            ? 'Ready to publish'
            : `${issues.length} conflicts and ${missing.length} unassigned periods`
        }
        tone={ready ? 'success' : 'warning'}
      >
        {ready
          ? 'Teacher availability, room allocation and required periods pass the demo checks.'
          : 'Complete the routine and resolve overlapping teacher or room assignments before publishing.'}
      </Notice>
      {issues.map((issue) => (
        <Panel title={issue.title} key={`${issue.lessonId}-${issue.kind}`}>
          <p className="text-muted-foreground">{issue.detail}</p>
        </Panel>
      ))}
      {!!missing.length && (
        <Panel title="Unassigned periods">
          <p className="text-muted-foreground">
            {missing.map((slot) => `${slot.day} Period ${slot.period}`).join(' · ')}
          </p>
        </Panel>
      )}
      {!ready && (
        <div className="demo-actions">
          <DemoLink to="/routine">Back to lesson builder</DemoLink>
          <Button
            variant="outline"
            onClick={() => {
              dispatch({ type: 'routine-resolve' });
              notify(
                'Suggested changes applied. Review the conflict and unassigned-period counts.',
              );
            }}
          >
            Apply fixes & complete periods
          </Button>
        </div>
      )}
      <div className="demo-field">
        <Label htmlFor="routine-note">Publication note</Label>
        <Input
          id="routine-note"
          value={note}
          maxLength={500}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>
      <div className="demo-actions">
        <DemoLink to="/routine">Back to builder</DemoLink>
        <Button
          disabled={!ready || routine.published}
          onClick={() => {
            dispatch({ type: 'routine-publish', note });
            notify('Routine published. The previous version remains in history.');
            void navigate({ to: '/routine/teacher' });
          }}
        >
          {routine.published ? 'Already published' : 'Publish routine'}
        </Button>
      </div>
    </>
  );
}
