import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useFormContext, useWatch } from 'react-hook-form';
import { useDemo } from '../../_component/demo-provider';
import { DemoForm, valueOf } from '../../_component/demo-form';
import { DemoLink, Notice, PageHeading } from '../../_component/demo-ui';
import type { Lesson } from '../../_component/demo-model';

export function LessonForm({ day, period }: { day: string; period: string }) {
  const { state, dispatch, notify } = useDemo();
  const navigate = useNavigate();
  const [error] = useState('');
  const lesson = state.routine.lessons.find((l) => l.day === day && l.period === period);
  return (
    <>
      <PageHeading
        title={lesson ? 'Edit lesson' : 'Add a lesson'}
        description={`${state.routine.className} · ${day} · Period ${period}`}
      />
      {error && (
        <Notice title="Review this assignment" tone="danger">
          {error}
        </Notice>
      )}
      <DemoForm
        sections={[
          {
            title: 'Lesson assignment',
            fields: [
              {
                name: 'day',
                label: 'Teaching day',
                value: day,
                options: state.routine.days,
                required: true,
              },
              {
                name: 'period',
                label: 'Period',
                value: period,
                options: state.routine.periods.map((p) => p.id),
                required: true,
              },
              {
                name: 'subject',
                label: 'Subject',
                value: lesson?.subject ?? '',
                required: true,
              },
              {
                name: 'teacher',
                label: 'Assigned teacher',
                value:
                  lesson?.teacher ??
                  state.members.find((m) => m.role === 'Teacher' && m.active)?.id ??
                  '',
                options: state.members
                  .filter((m) => m.role === 'Teacher' && m.active)
                  .map((m) => m.id),
                optionLabels: Object.fromEntries(state.members.map((m) => [m.id, m.name])),
                required: true,
              },
              {
                name: 'room',
                label: 'Room',
                value: lesson?.room ?? '',
                required: true,
              },
            ],
          },
        ]}
        submitLabel="Save lesson & review"
        footer={<DemoLink to="/routine">Cancel</DemoLink>}
        onSubmit={async (values) => {
          const day = valueOf(values, 'day');
          const period = valueOf(values, 'period');
          const value: Lesson = {
            id: `${day}-${period}`,
            day,
            period,
            subject: valueOf(values, 'subject'),
            teacher: valueOf(values, 'teacher'),
            room: valueOf(values, 'room'),
          };
          if (!(await dispatch({ type: 'lesson-save', lesson: value }))) return;
          notify('Lesson saved to the draft. Conflicts must be resolved before publication.');
          void navigate({ to: '/routine/review' });
        }}
      >
        <LessonFeedback />
        <Notice title="Subject teaching assignments">
          Select an active school Teacher. The API checks published class routines for overlapping
          teacher and room assignments.
        </Notice>
      </DemoForm>
    </>
  );
}
function LessonFeedback() {
  const { snapshot } = useDemo();
  const { control } = useFormContext<Record<string, string>>();
  const values = useWatch({ control });
  return (
    <>
      {snapshot.routineConflicts
        .filter((i) => i.lessonId === `${values.day}-${values.period}`)
        .map((issue) => (
          <Notice key={`${issue.lessonId}-${issue.kind}`} title={issue.title} tone="warning">
            {issue.detail}
          </Notice>
        ))}
    </>
  );
}
