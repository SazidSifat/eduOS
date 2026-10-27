import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { LessonForm } from '../_component/lesson-form';

function Page() {
  const search = Route.useSearch();
  return (
    <LessonForm
      key={`${search.day}-${search.period}`}
      day={search.day ?? 'Monday'}
      period={search.period ?? '4'}
    />
  );
}

export const Route = createFileRoute('/_school/routine/lesson/')({
  validateSearch: (search: Record<string, unknown>) =>
    z
      .object({
        day: z.string().max(20).optional().catch(undefined),
        period: z.string().max(3).optional().catch(undefined),
      })
      .parse(search),
  component: Page,
});
