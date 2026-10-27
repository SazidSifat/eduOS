import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useFormContext, useWatch } from 'react-hook-form';
import { useDemo } from '../../_component/demo-provider';
import { DemoForm, valueOf } from '../../_component/demo-form';
import { DemoLink, Notice, PageHeading } from '../../_component/demo-ui';
import type { Lesson } from '../../_component/demo-model';
import { routineConflicts, subjects } from './routine-model';

export function LessonForm({ day, period }: { day: string; period: string }) {
  const { state, dispatch, notify } = useDemo();
  const navigate = useNavigate();
  const [error, setError] = useState('');
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
                value: lesson?.subject ?? 'Mathematics',
                options: subjects.map((s) => s.name),
                required: true,
              },
              {
                name: 'teacher',
                label: 'Assigned teacher',
                value: lesson?.teacher ?? 'Farhana Akter',
                options: subjects.map((s) => s.teacher),
                required: true,
              },
              {
                name: 'room',
                label: 'Room',
                value: lesson?.room ?? 'Classroom 3-A',
                options: [
                  'Classroom 3-A',
                  'Classroom 4-A',
                  'Classroom 5-B',
                  'Science room',
                  'ICT room',
                ],
                required: true,
              },
            ],
          },
        ]}
        submitLabel="Save lesson & review"
        footer={<DemoLink to="/routine">Cancel</DemoLink>}
        onSubmit={(values) => {
          if (
            subjects.find((s) => s.name === valueOf(values, 'subject'))?.teacher !==
            valueOf(values, 'teacher')
          ) {
            setError(
              'Choose the teacher assigned to this subject. The subject assignments are shown below.',
            );
            return;
          }
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
          dispatch({ type: 'lesson-save', lesson: value });
          notify('Lesson saved to the draft. Conflicts must be resolved before publication.');
          void navigate({ to: '/routine/review' });
        }}
      >
        <LessonFeedback />
        <Notice title="Subject teaching assignments">
          {subjects.map((s) => `${s.name}: ${s.teacher}`).join(' · ')}
        </Notice>
      </DemoForm>
    </>
  );
}
function LessonFeedback() {
  const { state } = useDemo();
  const { control } = useFormContext<Record<string, string>>();
  const values = useWatch({ control });
  const lesson: Lesson = {
    id: `${values.day}-${values.period}`,
    day: values.day ?? '',
    period: values.period ?? '',
    teacher: values.teacher ?? '',
    subject: values.subject ?? '',
    room: values.room ?? '',
  };
  const issues = routineConflicts({ ...state.routine, lessons: [lesson] });
  return (
    <>
      {issues.map((issue) => (
        <Notice key={issue.kind} title={issue.title} tone="warning">
          {issue.detail} You can retain this draft and resolve it on review.
        </Notice>
      ))}
    </>
  );
}
